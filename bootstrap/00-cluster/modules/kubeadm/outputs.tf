output "kubeconfig" {
  description = "Contenu du kubeconfig récupéré depuis le control-plane."
  value       = fileexists("${path.module}/kubeconfig-${var.cluster_name}") ? file("${path.module}/kubeconfig-${var.cluster_name}") : ""
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint de l'API server."
  value       = "https://${var.apiserver_advertise_address}:6443"
}
