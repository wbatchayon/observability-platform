variable "cluster_name" {
  description = "Nom du cluster AKS."
  type        = string
}

variable "kubernetes_version" {
  description = "Version de Kubernetes (ex: 1.29)."
  type        = string
  default     = "1.29"
}

variable "region" {
  description = "Région Azure (ex: westeurope)."
  type        = string
}

variable "resource_group" {
  description = "Nom du resource group Azure hébergeant le cluster."
  type        = string
}

variable "node_pool_size" {
  description = "Nombre de nœuds du pool par défaut."
  type        = number
  default     = 3
}

variable "node_instance_type" {
  description = "Taille de VM des nœuds (ex: Standard_D4s_v3)."
  type        = string
  default     = "Standard_D4s_v3"
}
