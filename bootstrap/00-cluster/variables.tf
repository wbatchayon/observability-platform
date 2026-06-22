# Sélecteur du fournisseur de cluster. Aiguille main.tf vers le bon module.
# Tous les modules exposent les mêmes outputs (kubeconfig, cluster_endpoint, cluster_name).
variable "cluster_provider" {
  description = "Fournisseur du cluster : kubeadm (on-prem/air-gap, défaut), existing (cluster déjà présent), eks, gke, aks, talos."
  type        = string
  default     = "kubeadm"

  validation {
    condition     = contains(["kubeadm", "existing", "eks", "gke", "aks", "talos"], var.cluster_provider)
    error_message = "cluster_provider doit valoir : kubeadm, existing, eks, gke, aks ou talos."
  }
}

variable "cluster_name" {
  description = "Nom du cluster Kubernetes."
  type        = string
}

variable "kubernetes_version" {
  description = "Version de Kubernetes à installer (ex: 1.29.4)."
  type        = string
  default     = "1.29.4"
}

variable "control_plane_nodes" {
  description = "Nœuds du control-plane (le premier initialise le cluster). Requis pour kubeadm et talos."
  type = list(object({
    name = string
    ip   = string
  }))
  default = []
}

variable "worker_nodes" {
  description = "Nœuds workers à joindre au cluster. Requis pour kubeadm et talos."
  type = list(object({
    name = string
    ip   = string
  }))
  default = []
}

variable "pod_cidr" {
  description = "Plage CIDR des pods (doit correspondre à la config du CNI)."
  type        = string
  default     = "10.244.0.0/16"
}

variable "service_cidr" {
  description = "Plage CIDR des services."
  type        = string
  default     = "10.96.0.0/12"
}

variable "cni" {
  description = "CNI à déployer (calico ou cilium)."
  type        = string
  default     = "calico"

  validation {
    condition     = contains(["calico", "cilium"], var.cni)
    error_message = "Le CNI doit être 'calico' ou 'cilium'."
  }
}

variable "apiserver_advertise_address" {
  description = "Adresse annoncée par l'API server (IP du premier control-plane). Requis pour kubeadm/talos."
  type        = string
  default     = ""
}

variable "ssh_user" {
  description = "Utilisateur SSH disposant des droits sudo sur les nœuds. Requis pour kubeadm."
  type        = string
  default     = ""
}

variable "ssh_private_key_path" {
  description = "Chemin de la clé privée SSH pour accéder aux nœuds. Requis pour kubeadm."
  type        = string
  default     = ""
}

variable "registry_mirror" {
  description = "Miroir de registre interne pour les images système (contexte air-gap). Vide = registres publics."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Provider "existing" : cluster Kubernetes déjà provisionné (Rancher/RKE2/k3s,
# cluster managé, etc.). Aucune ressource n'est créée, les outputs sont réexposés.
# ---------------------------------------------------------------------------
variable "existing_kubeconfig_path" {
  description = "Chemin vers un kubeconfig existant (provider existing). Prioritaire sur host/token."
  type        = string
  default     = ""
}

variable "existing_cluster_endpoint" {
  description = "Endpoint de l'API server du cluster existant (si pas de kubeconfig_path)."
  type        = string
  default     = ""
}

variable "existing_cluster_token" {
  description = "Token d'accès au cluster existant (alternative au kubeconfig_path)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "existing_cluster_ca_certificate" {
  description = "Certificat CA (base64) du cluster existant (avec host/token)."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Providers cloud (EKS / GKE / AKS) : inputs minimaux communs.
# ---------------------------------------------------------------------------
variable "region" {
  description = "Région cloud (eks/gke/aks). Ex: eu-west-1, europe-west1, westeurope."
  type        = string
  default     = ""
}

variable "node_pool_size" {
  description = "Nombre de nœuds du pool par défaut (eks/gke/aks)."
  type        = number
  default     = 3
}

variable "node_instance_type" {
  description = "Type d'instance/machine des nœuds (ex: t3.large, e2-standard-4, Standard_D4s_v3)."
  type        = string
  default     = ""
}

# Spécifique GKE.
variable "gcp_project_id" {
  description = "ID du projet GCP (provider gke)."
  type        = string
  default     = ""
}

# Spécifique AKS.
variable "azure_resource_group" {
  description = "Nom du resource group Azure (provider aks)."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Provider "talos" : bare-metal/VM via siderolabs/talos.
# ---------------------------------------------------------------------------
variable "talos_cluster_endpoint" {
  description = "Endpoint de l'API server Talos (ex: https://10.0.0.11:6443)."
  type        = string
  default     = ""
}
