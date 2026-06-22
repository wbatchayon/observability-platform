# Provisioning du cluster - bootstrap/00-cluster
#
# cluster_provider sélectionne la cible de déploiement. Valeurs possibles :
#   kubeadm  : cluster on-prem provisionné par SSH (défaut, contexte air-gap).
#   existing : cluster déjà présent (Rancher/RKE2/k3s, managé importé...). Ne crée rien.
#   eks      : AWS managé (module terraform-aws-modules/eks/aws).
#   gke      : Google managé (module terraform-google-modules/kubernetes-engine/google).
#   aks      : Azure managé (module Azure/aks/azurerm).
#   talos    : bare-metal/VM via le provider siderolabs/talos.
# Tous les providers exposent les mêmes outputs : kubeconfig, cluster_endpoint, cluster_name.
cluster_provider = "kubeadm"

cluster_name       = "observability-REMPLACEZ"
kubernetes_version = "1.29.4"

# ---------------------------------------------------------------------------
# Provider kubeadm (défaut). Requiert SSH + nœuds Linux.
# ---------------------------------------------------------------------------
control_plane_nodes = [
  { name = "cp-01", ip = "10.0.0.11" },
]
worker_nodes = [
  { name = "worker-01", ip = "10.0.0.21" },
  { name = "worker-02", ip = "10.0.0.22" },
  { name = "worker-03", ip = "10.0.0.23" },
]

pod_cidr                    = "10.244.0.0/16"
service_cidr                = "10.96.0.0/12"
cni                         = "calico"
apiserver_advertise_address = "10.0.0.11"
ssh_user                    = "REMPLACEZ"
ssh_private_key_path        = "~/.ssh/id_rsa"
registry_mirror             = "harbor.observability.internal"

# ---------------------------------------------------------------------------
# Provider existing : cluster déjà provisionné. Fournir un kubeconfig OU host+token.
# ---------------------------------------------------------------------------
# cluster_provider                = "existing"
# existing_kubeconfig_path        = "~/.kube/config"
# # Alternative au kubeconfig :
# existing_cluster_endpoint       = "https://k8s.exemple.internal:6443"
# existing_cluster_token          = "REMPLACEZ"
# existing_cluster_ca_certificate = "BASE64_CA"

# ---------------------------------------------------------------------------
# Provider eks (AWS). Credentials via AWS_PROFILE / variables d'environnement.
# ---------------------------------------------------------------------------
# cluster_provider   = "eks"
# region             = "eu-west-1"
# node_pool_size     = 3
# node_instance_type = "t3.large"

# ---------------------------------------------------------------------------
# Provider gke (GCP). Credentials via `gcloud auth application-default login`.
# ---------------------------------------------------------------------------
# cluster_provider   = "gke"
# gcp_project_id     = "mon-projet-gcp"
# region             = "europe-west1"
# node_pool_size     = 3
# node_instance_type = "e2-standard-4"

# ---------------------------------------------------------------------------
# Provider aks (Azure). Credentials via `az login`.
# ---------------------------------------------------------------------------
# cluster_provider     = "aks"
# azure_resource_group = "rg-observability"
# region               = "westeurope"
# node_pool_size       = 3
# node_instance_type   = "Standard_D4s_v3"

# ---------------------------------------------------------------------------
# Provider talos (bare-metal/VM). Nœuds amorcés en mode maintenance Talos.
# ---------------------------------------------------------------------------
# cluster_provider       = "talos"
# talos_cluster_endpoint = "https://10.0.0.11:6443"
# control_plane_nodes    = [{ name = "cp-01", ip = "10.0.0.11" }]
# worker_nodes           = [{ name = "worker-01", ip = "10.0.0.21" }]
