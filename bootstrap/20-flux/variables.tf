variable "kubeconfig_path" {
  description = "Chemin du kubeconfig (output de bootstrap/00-cluster)."
  type        = string
}

variable "git_repository_url" {
  description = "URL du dépôt Git GitOps (ex: ssh://git@github.com/org/observability-platform.git)."
  type        = string
}

variable "git_branch" {
  description = "Branche suivie par Flux."
  type        = string
  default     = "main"
}

variable "git_path" {
  description = "Chemin racine des manifests dans le dépôt."
  type        = string
  default     = "platform"
}

variable "environment" {
  description = "Environnement cible (dev/staging/prod) — sélectionne l'overlay environments/<env>."
  type        = string
}

variable "flux_namespace" {
  description = "Namespace de Flux."
  type        = string
  default     = "flux-system"
}

variable "git_token" {
  description = "Token Git pour le bootstrap Flux et l'image automation (SOPS, jamais en clair)."
  type        = string
  sensitive   = true
}
