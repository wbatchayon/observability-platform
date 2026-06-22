# Outputs standard (alignés avec les autres providers).
output "kubeconfig" {
  description = "Commande pour générer le kubeconfig AKS (le contenu n'est pas exposé en clair)."
  value       = "az aks get-credentials --resource-group ${var.resource_group} --name ${var.cluster_name}"
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint (FQDN) de l'API server AKS."
  value       = module.aks.host
}
