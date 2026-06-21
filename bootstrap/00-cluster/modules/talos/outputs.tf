# Outputs standard (alignés avec les autres providers).
output "kubeconfig" {
  description = "Chemin du kubeconfig Talos récupéré."
  value       = local_sensitive_file.kubeconfig.filename
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint de l'API server Talos."
  value       = var.cluster_endpoint
}
