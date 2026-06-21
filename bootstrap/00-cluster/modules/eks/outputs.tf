# Outputs standard (alignés avec les autres providers).
output "kubeconfig" {
  description = "Commande pour générer le kubeconfig EKS (le contenu n'est pas exposé en clair)."
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${var.cluster_name}"
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint de l'API server EKS."
  value       = module.eks.cluster_endpoint
}
