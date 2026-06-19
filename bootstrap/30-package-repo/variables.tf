variable "kubeconfig_path" {
  description = "Chemin du kubeconfig (output de bootstrap/00-cluster)."
  type        = string
}

variable "harbor_namespace" {
  description = "Namespace Kubernetes hébergeant Harbor."
  type        = string
  default     = "harbor"
}

variable "harbor_url" {
  description = "URL externe de Harbor (ex: https://harbor.observability.internal)."
  type        = string
}

variable "harbor_admin_password" {
  description = "Mot de passe admin Harbor (SOPS, jamais en clair)."
  type        = string
  sensitive   = true
}

variable "storage_size" {
  description = "Taille du stockage persistant pour le registre."
  type        = string
  default     = "100Gi"
}

variable "otel_version" {
  description = "Version des packages OpenTelemetry Collector contrib hébergés."
  type        = string
  default     = "0.148.0"
}

variable "retention_days" {
  description = "Rétention des artefacts non-release (jours)."
  type        = number
  default     = 90
}

variable "robot_token_rotation_days" {
  description = "Durée de vie + intervalle de rotation du token du compte robot read-only (jours)."
  type        = number
  default     = 90
}

variable "charts_seed_dir" {
  description = "Répertoire local contenant les charts Helm seedés hors-ligne pour l'amorçage air-gap (Harbor)."
  type        = string
  default     = "./charts-seed"
}
