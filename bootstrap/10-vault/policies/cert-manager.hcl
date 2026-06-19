# Policy dédiée à cert-manager : uniquement l'émission/signature de certificats via la PKI.

path "pki_int/sign/observability" {
  capabilities = ["create", "update"]
}

path "pki_int/issue/observability" {
  capabilities = ["create", "update"]
}

# Lecture de la chaîne de CA pour construire le bundle de confiance.
path "pki_int/cert/ca" {
  capabilities = ["read"]
}
