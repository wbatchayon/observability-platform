variable "cluster_name" {
  description = "Nom du cluster GKE."
  type        = string
}

variable "kubernetes_version" {
  description = "Version de Kubernetes (ex: 1.29)."
  type        = string
  default     = "1.29"
}

variable "region" {
  description = "Région GCP (ex: europe-west1)."
  type        = string
}

variable "project_id" {
  description = "ID du projet GCP."
  type        = string
}

variable "node_pool_size" {
  description = "Nombre de nœuds du pool par défaut."
  type        = number
  default     = 3
}

variable "node_instance_type" {
  description = "Type de machine des nœuds (ex: e2-standard-4)."
  type        = string
  default     = "e2-standard-4"
}
