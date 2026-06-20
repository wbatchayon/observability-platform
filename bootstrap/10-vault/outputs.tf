# Outputs consommés par platform/security (cert-manager) et les composants de la plateforme.
output "vault_address" {
  description = "Adresse de l'API Vault."
  value       = var.vault_address
}

output "vault_pki_issuer_path" {
  description = "Chemin d'émission des certificats mTLS via la PKI intermédiaire."
  value       = "${vault_mount.pki_int.path}/issue/${vault_pki_secret_backend_role.observability.name}"
}

output "vault_pki_sign_path" {
  description = "Chemin de signature des CSR via la PKI intermédiaire (utilisé par cert-manager)."
  value       = "${vault_mount.pki_int.path}/sign/${vault_pki_secret_backend_role.observability.name}"
}

output "vault_pki_role" {
  description = "Nom du rôle PKI d'émission."
  value       = vault_pki_secret_backend_role.observability.name
}

output "vault_k8s_auth_path" {
  description = "Chemin de la méthode d'auth Kubernetes."
  value       = vault_auth_backend.kubernetes.path
}
