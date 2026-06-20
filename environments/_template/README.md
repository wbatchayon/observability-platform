# environments/_template - modèle d'environnement

**La seule surface de configuration de la plateforme.** Pour créer un environnement :

```bash
cp -r environments/_template environments/<env>
```

Puis remplir les valeurs et chiffrer les secrets. Le reste du code (bootstrap, platform, ingress,
ansible) est **identique** d'un environnement à l'autre.

## Fichiers

| Fichier | Rôle | Consommé par |
|---|---|---|
| `00-cluster.tfvars` | provisioning cluster | `terraform -chdir=bootstrap/00-cluster` |
| `10-vault.tfvars` | Vault + PKI | `bootstrap/10-vault` |
| `20-flux.tfvars` | FluxCD | `bootstrap/20-flux` |
| `30-package-repo.tfvars` | Harbor | `bootstrap/30-package-repo` |
| `env-values.yaml` | ConfigMap `env-values` (variables NON sensibles) | substitution Flux dans `platform/` |
| `secrets.sops.yaml` | Secret `env-secrets` (variables sensibles, **chiffré SOPS**) | substitution Flux dans `platform/` |

## Secrets

- Ne **jamais** committer `secrets.sops.yaml` en clair. Remplir puis :
  ```bash
  make encrypt ENV=<env>
  ```
- Les secrets Terraform (`*_bindpass`, `git_token`, `harbor_admin_password`) sont fournis via des
  variables d'environnement `TF_VAR_*` (déchiffrées de SOPS au moment de `make bootstrap`).

## Lancer

```bash
make bootstrap ENV=<env>   # cluster -> Vault -> Flux -> Harbor
make deploy    ENV=<env>   # Flux réconcilie la plateforme
```
