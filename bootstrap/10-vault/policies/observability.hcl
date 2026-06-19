# Policy des composants de la plateforme : lecture des secrets KV + émission de certificats mTLS.

# Lecture des secrets de la plateforme (KV v2).
path "secret/data/observability/*" {
  capabilities = ["read"]
}

path "secret/metadata/observability/*" {
  capabilities = ["read", "list"]
}

# Émission de certificats mTLS via la PKI intermédiaire.
path "pki_int/issue/observability" {
  capabilities = ["create", "update"]
}

path "pki_int/sign/observability" {
  capabilities = ["create", "update"]
}
