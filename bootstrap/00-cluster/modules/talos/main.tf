# Module talos : provisionne un cluster Talos via le provider siderolabs/talos.
# Étapes : génération des secrets/machine config, application aux nœuds,
# bootstrap etcd sur le premier control-plane, récupération du kubeconfig.

locals {
  first_cp = var.control_plane_nodes[0]
}

# 1. Secrets de la machine (PKI, tokens) partagés par tous les nœuds.
resource "talos_machine_secrets" "this" {}

# 2. Configuration machine pour les control-plane.
data "talos_machine_configuration" "controlplane" {
  cluster_name     = var.cluster_name
  cluster_endpoint = var.cluster_endpoint
  machine_type     = "controlplane"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

# 3. Configuration machine pour les workers.
data "talos_machine_configuration" "worker" {
  cluster_name     = var.cluster_name
  cluster_endpoint = var.cluster_endpoint
  machine_type     = "worker"
  machine_secrets  = talos_machine_secrets.this.machine_secrets
}

# 4. Config client (talosctl) pour piloter les nœuds.
data "talos_client_configuration" "this" {
  cluster_name         = var.cluster_name
  client_configuration = talos_machine_secrets.this.client_configuration
  endpoints            = [for n in var.control_plane_nodes : n.ip]
}

# 5. Application de la config aux control-plane.
resource "talos_machine_configuration_apply" "controlplane" {
  for_each = { for n in var.control_plane_nodes : n.name => n }

  client_configuration        = talos_machine_secrets.this.client_configuration
  machine_configuration_input = data.talos_machine_configuration.controlplane.machine_configuration
  node                        = each.value.ip
}

# 6. Application de la config aux workers.
resource "talos_machine_configuration_apply" "worker" {
  for_each = { for n in var.worker_nodes : n.name => n }

  client_configuration        = talos_machine_secrets.this.client_configuration
  machine_configuration_input = data.talos_machine_configuration.worker.machine_configuration
  node                        = each.value.ip
}

# 7. Bootstrap etcd sur le premier control-plane.
resource "talos_machine_bootstrap" "this" {
  depends_on = [talos_machine_configuration_apply.controlplane]

  client_configuration = talos_machine_secrets.this.client_configuration
  node                 = local.first_cp.ip
}

# 8. Récupération du kubeconfig une fois le cluster bootstrappé.
resource "talos_cluster_kubeconfig" "this" {
  depends_on = [talos_machine_bootstrap.this]

  client_configuration = talos_machine_secrets.this.client_configuration
  node                 = local.first_cp.ip
}

# 9. Écriture du kubeconfig sur disque pour les couches supérieures.
resource "local_sensitive_file" "kubeconfig" {
  content  = talos_cluster_kubeconfig.this.kubeconfig_raw
  filename = "${path.module}/kubeconfig-${var.cluster_name}"
}
