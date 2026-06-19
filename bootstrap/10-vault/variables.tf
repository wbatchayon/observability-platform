variable "kubeconfig_path" {
  description = "Chemin du kubeconfig (output de bootstrap/00-cluster)."
  type        = string
}

variable "vault_address" {
  description = "Adresse de l'API Vault une fois déployée (ex: https://vault.observability.svc:8200)."
  type        = string
}

variable "vault_namespace" {
  description = "Namespace Kubernetes hébergeant Vault."
  type        = string
  default     = "vault"
}

variable "vault_replicas" {
  description = "Nombre de replicas Vault (HA Raft)."
  type        = number
  default     = 3
}

variable "pki_common_name" {
  description = "Common Name de la CA racine PKI (ex: observability.internal)."
  type        = string
}

variable "pki_ttl" {
  description = "TTL par défaut des certificats émis (ex: 72h)."
  type        = string
  default     = "72h"
}

variable "pki_max_ttl" {
  description = "TTL maximum des certificats émis (ex: 8760h)."
  type        = string
  default     = "8760h"
}

variable "allowed_domains" {
  description = "Domaines autorisés pour l'émission de certificats mTLS."
  type        = list(string)
  default     = ["svc.cluster.local", "observability.internal"]
}

variable "ldap_url" {
  description = "URL du serveur LDAP/AD (ex: ldaps://ad.example.com)."
  type        = string
}

variable "ldap_userdn" {
  description = "Base DN des utilisateurs LDAP."
  type        = string
}

variable "ldap_groupdn" {
  description = "Base DN des groupes LDAP."
  type        = string
}

variable "ldap_binddn" {
  description = "DN du compte de service pour le bind LDAP."
  type        = string
}

variable "ldap_bindpass" {
  description = "Mot de passe du compte de bind LDAP (fourni via SOPS, jamais en clair)."
  type        = string
  sensitive   = true
}
