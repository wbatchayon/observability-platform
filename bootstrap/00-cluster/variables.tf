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
  description = "Nœuds du control-plane (le premier initialise le cluster)."
  type = list(object({
    name = string
    ip   = string
  }))
}

variable "worker_nodes" {
  description = "Nœuds workers à joindre au cluster."
  type = list(object({
    name = string
    ip   = string
  }))
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
  description = "Adresse annoncée par l'API server (IP du premier control-plane)."
  type        = string
}

variable "ssh_user" {
  description = "Utilisateur SSH disposant des droits sudo sur les nœuds."
  type        = string
}

variable "ssh_private_key_path" {
  description = "Chemin de la clé privée SSH pour accéder aux nœuds."
  type        = string
}

variable "registry_mirror" {
  description = "Miroir de registre interne pour les images système (contexte air-gap). Vide = registres publics."
  type        = string
  default     = ""
}
