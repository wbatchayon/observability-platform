# Provisioning du cluster Kubernetes via le module kubeadm (défaut on-prem, air-gap).
# Pour une cible cloud managé (EKS/GKE/AKS), substituer ce module par le module
# correspondant tout en conservant les mêmes outputs (kubeconfig, cluster_endpoint, cluster_name).

module "kubeadm" {
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
