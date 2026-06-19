# Outputs consommés par bootstrap/10-vault et bootstrap/20-flux.
output "kubeconfig" {
  description = "Kubeconfig du cluster provisionné."
  value       = module.kubeadm.kubeconfig
  sensitive   = true
}

output "cluster_endpoint" {
  description = "Endpoint de l'API server Kubernetes."
  value       = module.kubeadm.api_endpoint
}

output "cluster_name" {
  description = "Nom du cluster."
  value       = var.cluster_name
}
