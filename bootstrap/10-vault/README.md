# bootstrap/10-vault - Vault + PKI mTLS + auth

Déploie HashiCorp Vault (HA Raft), configure la **PKI** (CA racine + intermédiaire) pour le
**mTLS de bout en bout**, et les méthodes d'authentification (Kubernetes pour les pods, LDAP/AD
pour les humains).

## Prérequis

- Cluster provisionné (`bootstrap/00-cluster`) → `kubeconfig`.
- Chart et images Vault servis depuis **Harbor** (OCI) - aucun accès Internet.
- **Auto-unseal Transit** activé par défaut : un Vault de bootstrap (interne, air-gap) expose un
  moteur `transit/` avec une clé d'unseal. Vault se descelle automatiquement au démarrage.

## Auto-unseal (Transit, air-gap)

Plutôt qu'un KMS cloud (interdit en air-gap), on utilise le **seal Transit** :

1. Un petit Vault de bootstrap (ou un cluster Vault dédié) active le moteur `transit` et crée une
   clé (`transit_unseal_key_name`).
2. Un token avec une policy restreinte (`encrypt`/`decrypt` sur cette clé) est fourni au Vault
   principal via le secret Kubernetes `vault-transit-unseal` (clé `token`, injectée depuis SOPS).
3. Le CA TLS du Vault de bootstrap est monté via le secret `transit-tls`.

Création du secret (token déchiffré de SOPS) :

```bash
kubectl -n vault create secret generic vault-transit-unseal \
  --from-literal=token="$VAULT_TRANSIT_TOKEN"
```

## Séquence

```bash
terraform init
# 0. Créer le secret du token Transit (auto-unseal)
kubectl -n vault create secret generic vault-transit-unseal --from-literal=token="$VAULT_TRANSIT_TOKEN"
# 1. Déployer Vault uniquement
terraform apply -target=helm_release.vault -var-file=../../environments/dev/10-vault.tfvars
# 2. Initialiser (le descellement est AUTOMATIQUE via Transit)
kubectl -n vault exec -it vault-0 -- vault operator init
export VAULT_TOKEN=<root-or-admin-token>
# 3. Appliquer PKI + auth
terraform apply -var-file=../../environments/dev/10-vault.tfvars
```

## Variables (via `environments/<env>/10-vault.tfvars`)

`kubeconfig_path`, `vault_address`, `vault_namespace`, `vault_replicas`, `pki_common_name`,
`pki_ttl`, `pki_max_ttl`, `allowed_domains`, `ldap_url`, `ldap_userdn`, `ldap_groupdn`,
`ldap_binddn`, `ldap_bindpass` (SOPS).

## Outputs (consommés par platform/security)

| Output | Usage |
|---|---|
| `vault_address` | endpoint pour cert-manager |
| `vault_pki_sign_path` | `pki_int/sign/observability` - cert-manager signe les CSR |
| `vault_pki_issuer_path` | `pki_int/issue/observability` |
| `vault_pki_role` | `observability` |
| `vault_k8s_auth_path` | auth Kubernetes pour cert-manager |

## mTLS

cert-manager (dans `platform/security`) crée un `ClusterIssuer` nommé `vault-issuer` qui
s'authentifie via l'auth Kubernetes (rôle `cert-manager`) et signe les certificats via
`pki_int/sign/observability`. Tous les composants obtiennent ainsi leurs certificats mTLS.
