# PKI Vault pour le mTLS de bout en bout (consommée par cert-manager dans platform/security).
provider "vault" {
  address = var.vault_address
  # Le token d'admin est fourni via la variable d'env VAULT_TOKEN (post-unseal).
}

# CA racine
resource "vault_mount" "pki_root" {
  path                      = "pki"
  type                      = "pki"
  default_lease_ttl_seconds = 31536000
  max_lease_ttl_seconds     = 315360000
}

resource "vault_pki_secret_backend_root_cert" "root" {
  backend     = vault_mount.pki_root.path
  type        = "internal"
  common_name = var.pki_common_name
  ttl         = "315360000"
}

# CA intermédiaire (émettrice des certificats de service)
resource "vault_mount" "pki_int" {
  path                      = "pki_int"
  type                      = "pki"
  default_lease_ttl_seconds = 2592000
  max_lease_ttl_seconds     = 31536000
}

resource "vault_pki_secret_backend_intermediate_cert_request" "int" {
  backend     = vault_mount.pki_int.path
  type        = "internal"
  common_name = "${var.pki_common_name} Intermediate Authority"
}

resource "vault_pki_secret_backend_root_sign_intermediate" "int" {
  backend     = vault_mount.pki_root.path
  csr         = vault_pki_secret_backend_intermediate_cert_request.int.csr
  common_name = "${var.pki_common_name} Intermediate Authority"
  ttl         = "157680000"
}

resource "vault_pki_secret_backend_intermediate_set_signed" "int" {
  backend     = vault_mount.pki_int.path
  certificate = vault_pki_secret_backend_root_sign_intermediate.int.certificate
}

# Rôle d'émission des certificats mTLS de la plateforme.
resource "vault_pki_secret_backend_role" "observability" {
  backend          = vault_mount.pki_int.path
  name             = "observability"
  allowed_domains  = var.allowed_domains
  allow_subdomains = true
  allow_localhost  = true
  max_ttl          = var.pki_max_ttl
  ttl              = var.pki_ttl
  key_type         = "rsa"
  key_bits         = 2048
}
