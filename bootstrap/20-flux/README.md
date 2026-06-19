# bootstrap/20-flux — Bootstrap FluxCD (moteur GitOps)

Installe FluxCD et connecte le dépôt GitOps. Flux **réconcilie en continu** `platform/` en
injectant l'overlay de l'environnement (`environments/<env>/`).

## Prérequis

- Cluster provisionné (`bootstrap/00-cluster`) → `kubeconfig`.
- Dépôt Git accessible + token (`git_token`, via SOPS).
- `flux check --pre` doit passer.

## Comment l'overlay d'environnement est appliqué

La `Kustomization` racine (`kustomizations.yaml`) utilise `postBuild.substituteFrom` : les
variables `${...}` des manifests `platform/` sont résolues depuis :

- le **ConfigMap `env-values`** (valeurs non sensibles de `environments/<env>/*.values.yaml`),
- le **Secret `env-secrets`** (valeurs sensibles déchiffrées depuis SOPS).

Ainsi le même code `platform/` produit un déploiement spécifique par environnement, sans
duplication.

## Utilisation

```bash
terraform init
terraform apply -var-file=../../environments/dev/20-flux.tfvars
flux check
flux get kustomizations
```

## Automatisation

- **image-automation.yaml** : ouvre une **PR** (`flux-image-updates`) quand une image signée plus
  récente est publiée dans le dépôt interne — jamais de push direct sur `main`.
- **notification.yaml** : alerte (drift, échecs de reconcile) vers OneUptime.

## Outputs

`flux_namespace`, `git_repository_name`, `root_kustomization_name`.
