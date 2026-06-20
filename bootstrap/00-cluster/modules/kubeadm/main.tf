# Module kubeadm : initialise le control-plane, installe le CNI, joint les workers.
# Idempotent : les commandes kubeadm vérifient l'état existant avant d'agir.

locals {
  first_cp     = var.control_plane_nodes[0]
  join_token   = "" # généré dynamiquement sur le control-plane (voir remote-exec)
  cni_manifest = var.cni == "calico" ? "calico.yaml" : "cilium.yaml"
  all_nodes    = concat(var.control_plane_nodes, var.worker_nodes)
  # Registres publics redirigés vers le miroir Harbor interne (air-gap).
  mirrored_registries = ["docker.io", "quay.io", "ghcr.io", "registry.k8s.io"]
}

# 0. Configure containerd sur CHAQUE nœud pour rediriger tous les registres publics vers Harbor.
#    Garantit qu'aucune image n'est tirée depuis Internet.
resource "null_resource" "containerd_mirror" {
  for_each = var.registry_mirror != "" ? { for n in local.all_nodes : n.name => n } : {}

  triggers = {
    node_ip = each.value.ip
    mirror  = var.registry_mirror
  }

  connection {
    type        = "ssh"
    host        = each.value.ip
    user        = var.ssh_user
    private_key = file(var.ssh_private_key_path)
  }

  provisioner "remote-exec" {
    # Configuration idempotente et robuste du miroir containerd -> Harbor (air-gap strict).
    inline = [
      <<-EOT
      set -euo pipefail
      MIRROR="${var.registry_mirror}"
      REGISTRIES="${join(" ", local.mirrored_registries)}"
      CONF=/etc/containerd/config.toml

      # 0. Garantir l'existence d'une config containerd de base.
      sudo mkdir -p /etc/containerd /etc/containerd/certs.d
      if [ ! -f "$CONF" ] || ! grep -q 'io.containerd.grpc.v1.cri' "$CONF"; then
        containerd config default | sudo tee "$CONF" >/dev/null
      fi

      # 1. Activer config_path (certs.d) de façon idempotente, quel que soit l'état initial.
      if ! grep -q 'config_path = "/etc/containerd/certs.d"' "$CONF"; then
        if grep -q '\[plugins."io.containerd.grpc.v1.cri".registry\]' "$CONF"; then
          # Remplacer un config_path existant (souvent "") dans la section registry.
          sudo sed -i '/\[plugins."io.containerd.grpc.v1.cri".registry\]/,/^\[/ s#config_path = .*#config_path = "/etc/containerd/certs.d"#' "$CONF"
          # Si toujours absent, l'insérer juste après l'en-tête de section.
          grep -q 'config_path = "/etc/containerd/certs.d"' "$CONF" || \
            sudo sed -i '/\[plugins."io.containerd.grpc.v1.cri".registry\]/a\    config_path = "/etc/containerd/certs.d"' "$CONF"
        else
          # Section registry absente : l'ajouter.
          printf '\n[plugins."io.containerd.grpc.v1.cri".registry]\n  config_path = "/etc/containerd/certs.d"\n' | sudo tee -a "$CONF" >/dev/null
        fi
      fi

      # 2. Rediriger l'image sandbox (pause) vers Harbor.
      if grep -q 'sandbox_image' "$CONF"; then
        sudo sed -i "s#sandbox_image = .*#sandbox_image = \"$MIRROR/library/pause:3.9\"#" "$CONF"
      fi

      # 3. Écrire un hosts.toml par registre public, pointant vers Harbor.
      for reg in $REGISTRIES; do
        sudo mkdir -p "/etc/containerd/certs.d/$reg"
        sudo tee "/etc/containerd/certs.d/$reg/hosts.toml" >/dev/null <<HOSTS
      server = "https://$MIRROR"

      [host."https://$MIRROR"]
        capabilities = ["pull", "resolve"]
        override_path = true
      HOSTS
      done

      # 4. Vérification stricte : config_path doit être actif, sinon échec (pas de fallback Internet).
      grep -q 'config_path = "/etc/containerd/certs.d"' "$CONF" || { echo "ECHEC: config_path containerd non configuré" >&2; exit 1; }

      sudo systemctl restart containerd
      EOT
    ]
  }
}

# 1. Initialisation du premier nœud control-plane.
resource "null_resource" "control_plane_init" {
  depends_on = [null_resource.containerd_mirror]

  triggers = {
    cluster_name = var.cluster_name
    k8s_version  = var.kubernetes_version
    cp_ip        = local.first_cp.ip
  }

  connection {
    type        = "ssh"
    host        = local.first_cp.ip
    user        = var.ssh_user
    private_key = file(var.ssh_private_key_path)
  }

  provisioner "remote-exec" {
    inline = [
      "set -e",
      # kubeadm init idempotent : ne ré-initialise pas si déjà fait.
      "if [ ! -f /etc/kubernetes/admin.conf ]; then",
      "  sudo kubeadm init \\",
      "    --kubernetes-version=${var.kubernetes_version} \\",
      "    --pod-network-cidr=${var.pod_cidr} \\",
      "    --service-cidr=${var.service_cidr} \\",
      "    --apiserver-advertise-address=${var.apiserver_advertise_address} \\",
      "    ${var.registry_mirror != "" ? "--image-repository=${var.registry_mirror}" : ""}",
      "fi",
      "mkdir -p $HOME/.kube",
      "sudo cp -f /etc/kubernetes/admin.conf $HOME/.kube/config",
      "sudo chown $(id -u):$(id -g) $HOME/.kube/config",
      # Installation du CNI (manifest servi par le miroir interne en air-gap).
      "kubectl apply -f ${var.registry_mirror != "" ? "https://${var.registry_mirror}/cni/${local.cni_manifest}" : "https://raw.githubusercontent.com/projectcalico/calico/v3.27.0/manifests/calico.yaml"} || true",
    ]
  }
}

# 2. Récupération du kubeconfig.
resource "null_resource" "fetch_kubeconfig" {
  depends_on = [null_resource.control_plane_init]

  triggers = {
    cp_ip = local.first_cp.ip
  }

  connection {
    type        = "ssh"
    host        = local.first_cp.ip
    user        = var.ssh_user
    private_key = file(var.ssh_private_key_path)
  }

  provisioner "local-exec" {
    command = "scp -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=accept-new ${var.ssh_user}@${local.first_cp.ip}:.kube/config ${path.module}/kubeconfig-${var.cluster_name}"
  }
}

# 3. Jonction des workers.
resource "null_resource" "worker_join" {
  for_each   = { for n in var.worker_nodes : n.name => n }
  depends_on = [null_resource.control_plane_init, null_resource.containerd_mirror]

  triggers = {
    node_ip = each.value.ip
  }

  connection {
    type        = "ssh"
    host        = each.value.ip
    user        = var.ssh_user
    private_key = file(var.ssh_private_key_path)
  }

  provisioner "remote-exec" {
    inline = [
      "set -e",
      # Récupère la commande de jonction depuis le control-plane puis l'exécute si non déjà joint.
      "if [ ! -f /etc/kubernetes/kubelet.conf ]; then",
      "  JOIN_CMD=$(ssh -o StrictHostKeyChecking=accept-new ${var.ssh_user}@${local.first_cp.ip} 'sudo kubeadm token create --print-join-command')",
      "  sudo $JOIN_CMD",
      "fi",
    ]
  }
}
