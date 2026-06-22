# Réexpose les outputs standard à partir des entrées fournies.
output "kubeconfig" {
  description = "Kubeconfig du cluster existant (chemin si fourni, sinon contenu reconstruit, sinon vide)."
  value       = var.kubeconfig_path != "" ? var.kubeconfig_path : ""
  sensitive   = true
}

output "api_endpoint" {
  description = "Endpoint de l'API server du cluster existant."
  value       = local.endpoint
}

output "cluster_ca_certificate" {
  description = "Certificat CA du cluster existant (si fourni)."
  value       = var.ca_certificate
  sensitive   = true
}
