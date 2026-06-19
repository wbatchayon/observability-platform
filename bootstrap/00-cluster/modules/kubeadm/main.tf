# Module kubeadm : initialise le control-plane, installe le CNI, joint les workers.
# Idempotent : les commandes kubeadm vérifient l'état existant avant d'agir.

locals {
  first_cp     = var.control_plane_nodes[0]
  join_token   = "" # généré dynamiquement sur le control-plane (voir remote-exec)
  cni_manifest = var.cni == "calico" ? "calico.yaml" : "cilium.yaml"
}

# 1. Initialisation du premier nœud control-plane.
resource "null_resource" "control_plane_init" {
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
  depends_on = [null_resource.control_plane_init]

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
