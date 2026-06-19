output "flux_namespace" {
  description = "Namespace de Flux."
  value       = var.flux_namespace
}

output "git_repository_name" {
  description = "Nom de la GitRepository Flux."
  value       = "observability-platform"
}

output "root_kustomization_name" {
  description = "Nom de la Kustomization racine réconciliant platform/."
  value       = "platform"
}
