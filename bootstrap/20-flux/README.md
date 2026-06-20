# bootstrap/20-flux - Bootstrap FluxCD (moteur GitOps)

Installe FluxCD et connecte le dépôt GitOps. Flux **réconcilie en continu** `platform/` en
injectant l'overlay de l'environnement (`environments/<env>/`).

## Prérequis

- Cluster provisionné (`bootstrap/00-cluster`) → `kubeconfig`.
- Dépôt Git accessible + token (`git_token`, via SOPS).
- `flux check --pre` doit passer.

## Comment l'overlay d'environnement est appliqué

Le bootstrap Flux réconcilie le chemin **`clusters/<env>/`**. Celui-ci définit :

1. la `GitRepository` source,
2. une Kustomization **`env-config`** qui applique `environments/<env>/` (ConfigMap `env-values` +
   Secret `env-secrets` **déchiffré par SOPS** via `decryption.provider: sops`, secret `sops-age`),
3. une Kustomization **`platform`** (`dependsOn: env-config`) qui réconcilie `./platform` avec
   `postBuild.substituteFrom` des variables `${...}` depuis `env-values`/`env-secrets`.

Ainsi le même code `platform/` produit un déploiement spécifique par environnement, sans
duplication.

> Prérequis : créer le secret de déchiffrement SOPS dans `flux-system` :
> `kubectl -n flux-system create secret generic sops-age --from-file=age.agekey=$SOPS_AGE_KEY_FILE`

## Utilisation

```bash
terraform init
terraform apply -var-file=../../environments/dev/20-flux.tfvars
flux check
flux get kustomizations
```

## Automatisation

- **image-automation.yaml** : ouvre une **PR** (`flux-image-updates`) quand une image signée plus
  récente est publiée dans le dépôt interne - jamais de push direct sur `main`.
- **notification.yaml** : alerte (drift, échecs de reconcile) vers OneUptime.

## Outputs

`flux_namespace`, `git_repository_name`, `root_kustomization_name`.
