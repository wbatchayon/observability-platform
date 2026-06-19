# Méthodes d'authentification Vault : Kubernetes (pods) + LDAP/AD (humains).

# 1. Auth Kubernetes : cert-manager et les composants s'authentifient via leur ServiceAccount.
resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "k8s" {
  backend         = vault_auth_backend.kubernetes.path
  kubernetes_host = var.vault_address
}

# Rôle pour cert-manager (émission de certificats via la PKI).
resource "vault_kubernetes_auth_backend_role" "cert_manager" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "cert-manager"
  bound_service_account_names      = ["cert-manager"]
  bound_service_account_namespaces = ["security"]
  token_policies                   = [vault_policy.cert_manager.name]
  token_ttl                        = 3600
}

# Rôle générique pour les composants de la plateforme (lecture de secrets).
resource "vault_kubernetes_auth_backend_role" "observability" {
  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = "observability"
  bound_service_account_names      = ["*"]
  bound_service_account_namespaces = ["backends", "ingestion", "monitoring", "visualization", "storage", "incident"]
  token_policies                   = [vault_policy.observability.name]
  token_ttl                        = 3600
}

# 2. Auth LDAP/AD pour les accès humains.
resource "vault_ldap_auth_backend" "ldap" {
  path      = "ldap"
  url       = var.ldap_url
  userdn    = var.ldap_userdn
  groupdn   = var.ldap_groupdn
  binddn    = var.ldap_binddn
  bindpass  = var.ldap_bindpass
  starttls  = true
}

# Mapping groupe LDAP -> policy Vault.
resource "vault_ldap_auth_backend_group" "admins" {
  backend   = vault_ldap_auth_backend.ldap.path
  groupname = "observability-admins"
  policies  = [vault_policy.observability.name, vault_policy.cert_manager.name]
}

# Policies (définies dans les fichiers .hcl du dossier policies/).
resource "vault_policy" "observability" {
  name   = "observability"
  policy = file("${path.module}/policies/observability.hcl")
}

resource "vault_policy" "cert_manager" {
  name   = "cert-manager"
  policy = file("${path.module}/policies/cert-manager.hcl")
}
