# bootstrap/10-vault — Vault + PKI mTLS + auth

Déploie HashiCorp Vault (HA Raft), configure la **PKI** (CA racine + intermédiaire) pour le
**mTLS de bout en bout**, et les méthodes d'authentification (Kubernetes pour les pods, LDAP/AD
pour les humains).

## Prérequis

- Cluster provisionné (`bootstrap/00-cluster`) → `kubeconfig`.
- Après `helm_release.vault`, Vault doit être **initialisé et descellé** (init/unseal) avant
  d'appliquer la PKI/auth (le provider `vault` nécessite `VAULT_TOKEN`). En production, utiliser
  l'**auto-unseal** (Transit/KMS) — documenté ci-dessous.

## Séquence

```bash
terraform init
# 1. Déployer Vault uniquement
terraform apply -target=helm_release.vault -var-file=../../environments/dev/10-vault.tfvars
# 2. Initialiser/desceller (à automatiser via auto-unseal en prod)
kubectl -n vault exec -it vault-0 -- vault operator init
kubectl -n vault exec -it vault-0 -- vault operator unseal
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
| `vault_pki_sign_path` | `pki_int/sign/observability` — cert-manager signe les CSR |
| `vault_pki_issuer_path` | `pki_int/issue/observability` |
| `vault_pki_role` | `observability` |
| `vault_k8s_auth_path` | auth Kubernetes pour cert-manager |

## mTLS

cert-manager (dans `platform/security`) crée un `ClusterIssuer` nommé `vault-issuer` qui
s'authentifie via l'auth Kubernetes (rôle `cert-manager`) et signe les certificats via
`pki_int/sign/observability`. Tous les composants obtiennent ainsi leurs certificats mTLS.
