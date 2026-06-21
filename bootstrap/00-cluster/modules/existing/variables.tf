variable "cluster_name" {
  description = "Nom du cluster existant."
  type        = string
}

variable "kubeconfig_path" {
  description = "Chemin vers un kubeconfig existant. Prioritaire sur host/token."
  type        = string
  default     = ""
}

variable "cluster_endpoint" {
  description = "Endpoint de l'API server (utilisé si kubeconfig_path est vide)."
  type        = string
  default     = ""
}

variable "cluster_token" {
  description = "Token d'accès au cluster (alternative au kubeconfig_path)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "ca_certificate" {
  description = "Certificat CA (base64) du cluster (avec host/token)."
  type        = string
  default     = ""
}
