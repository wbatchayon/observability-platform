variable "cluster_name" {
  description = "Nom du cluster."
  type        = string
}

variable "kubernetes_version" {
  description = "Version de Kubernetes."
  type        = string
}

variable "control_plane_nodes" {
  description = "Nœuds du control-plane."
  type = list(object({
    name = string
    ip   = string
  }))
}

variable "worker_nodes" {
  description = "Nœuds workers."
  type = list(object({
    name = string
    ip   = string
  }))
}

variable "pod_cidr" {
  description = "CIDR des pods."
  type        = string
}

variable "service_cidr" {
  description = "CIDR des services."
  type        = string
}

variable "cni" {
  description = "CNI (calico/cilium)."
  type        = string
}

variable "apiserver_advertise_address" {
  description = "Adresse annoncée par l'API server."
  type        = string
}

variable "ssh_user" {
  description = "Utilisateur SSH sudo."
  type        = string
}

variable "ssh_private_key_path" {
  description = "Chemin de la clé privée SSH."
  type        = string
}

variable "registry_mirror" {
  description = "Miroir de registre interne (air-gap)."
  type        = string
}
