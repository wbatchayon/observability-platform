variable "cluster_name" {
  description = "Nom du cluster EKS."
  type        = string
}

variable "kubernetes_version" {
  description = "Version de Kubernetes (ex: 1.29)."
  type        = string
  default     = "1.29"
}

variable "region" {
  description = "Région AWS (ex: eu-west-1)."
  type        = string
}

variable "node_pool_size" {
  description = "Nombre de nœuds du managed node group par défaut."
  type        = number
  default     = 3
}

variable "node_instance_type" {
  description = "Type d'instance EC2 des nœuds (ex: t3.large)."
  type        = string
  default     = "t3.large"
}

variable "vpc_cidr" {
  description = "CIDR du VPC minimal créé pour le cluster."
  type        = string
  default     = "10.0.0.0/16"
}
