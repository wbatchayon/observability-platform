# Outputs standard (alignés avec les autres providers).
output "kubeconfig" {
  description = "Commande pour générer le kubeconfig GKE (le contenu n'est pas exposé en clair)."
  value       = "gcloud container clusters get-credentials ${var.cluster_name} --region ${var.region} --project ${var.project_id}"
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint de l'API server GKE."
  value       = "https://${module.gke.endpoint}"
}
