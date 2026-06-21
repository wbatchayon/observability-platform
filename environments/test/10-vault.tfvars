# Vault + PKI - bootstrap/10-vault
kubeconfig_path = "../00-cluster/modules/kubeadm/kubeconfig-observability-test"
vault_address   = "https://vault.vault.svc.cluster.local:8200"
vault_namespace = "vault"
vault_replicas  = 3

harbor_registry = "harbor.observability.internal"

# Auto-unseal Transit (Vault de bootstrap interne, air-gap)
transit_unseal_address  = "https://vault-bootstrap.vault.svc.cluster.local:8200"
transit_unseal_key_name = "vault-unseal"

pki_common_name = "observability.internal"
pki_ttl         = "72h"
pki_max_ttl     = "8760h"
allowed_domains = ["svc.cluster.local", "observability.internal"]

ldap_url     = "ldaps://ad.example.com"
ldap_userdn  = "ou=Users,dc=example,dc=com"
ldap_groupdn = "ou=Groups,dc=example,dc=com"
ldap_binddn  = "cn=svc-vault,ou=Service,dc=example,dc=com"
# ldap_bindpass : fourni via la variable d'env TF_VAR_ldap_bindpass (déchiffrée de SOPS).
