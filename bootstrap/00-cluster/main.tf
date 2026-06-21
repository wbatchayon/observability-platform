# Provisioning du cluster Kubernetes, pluggable via var.cluster_provider.
# Chaque module est activé par un count conditionnel et expose les MÊMES outputs
# (kubeconfig, cluster_endpoint, cluster_name) consommés par outputs.tf.
#
# Providers supportés : kubeadm (défaut, on-prem/air-gap), existing, eks, gke, aks, talos.

# --- kubeadm : on-prem via SSH (contexte air-gap multi-DC). ---
module "kubeadm" {
  count  = var.cluster_provider == "kubeadm" ? 1 : 0
  source = "./modules/kubeadm"

  cluster_name                = var.cluster_name
  kubernetes_version          = var.kubernetes_version
  control_plane_nodes         = var.control_plane_nodes
  worker_nodes                = var.worker_nodes
  pod_cidr                    = var.pod_cidr
  service_cidr                = var.service_cidr
  cni                         = var.cni
  apiserver_advertise_address = var.apiserver_advertise_address
  ssh_user                    = var.ssh_user
  ssh_private_key_path        = var.ssh_private_key_path
  registry_mirror             = var.registry_mirror
}

# --- existing : cluster déjà provisionné (Rancher/RKE2/k3s, managé...). ---
module "existing" {
  count  = var.cluster_provider == "existing" ? 1 : 0
  source = "./modules/existing"

  cluster_name     = var.cluster_name
  kubeconfig_path  = var.existing_kubeconfig_path
  cluster_endpoint = var.existing_cluster_endpoint
  cluster_token    = var.existing_cluster_token
  ca_certificate   = var.existing_cluster_ca_certificate
}

# --- eks : AWS managé via terraform-aws-modules/eks/aws. ---
module "eks" {
  count  = var.cluster_provider == "eks" ? 1 : 0
  source = "./modules/eks"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  region             = var.region
  node_pool_size     = var.node_pool_size
  node_instance_type = var.node_instance_type
}

# --- gke : Google managé via terraform-google-modules/kubernetes-engine/google. ---
module "gke" {
  count  = var.cluster_provider == "gke" ? 1 : 0
  source = "./modules/gke"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  region             = var.region
  project_id         = var.gcp_project_id
  node_pool_size     = var.node_pool_size
  node_instance_type = var.node_instance_type
}

# --- aks : Azure managé via Azure/aks/azurerm. ---
module "aks" {
  count  = var.cluster_provider == "aks" ? 1 : 0
  source = "./modules/aks"

  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  region             = var.region
  resource_group     = var.azure_resource_group
  node_pool_size     = var.node_pool_size
  node_instance_type = var.node_instance_type
}

# --- talos : bare-metal/VM via siderolabs/talos. ---
module "talos" {
  count  = var.cluster_provider == "talos" ? 1 : 0
  source = "./modules/talos"

  cluster_name        = var.cluster_name
  cluster_endpoint    = var.talos_cluster_endpoint
  control_plane_nodes = var.control_plane_nodes
  worker_nodes        = var.worker_nodes
}
