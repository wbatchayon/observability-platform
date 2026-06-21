# Contribuer

Merci de votre intérêt ! Ce projet est open source sous licence
[Apache 2.0](LICENSE). Toute contribution (code, doc, tests, retours) est bienvenue.

## Démarrage rapide

```bash
git clone https://github.com/wbatchayon/observability-platform.git
cd observability-platform
make validate     # lint + kubeconform + terraform validate
```

Outils attendus : `terraform`, `kubectl`, `kustomize`, `helm`, `flux`, `sops`,
`age`, `ansible-lint`, `yamllint`. La console web se développe dans `gui/` (Node 20+).

## Workflow des Pull Requests

1. **Fork / branche** : `feat/<sujet>`, `fix/<sujet>`, `docs/<sujet>`, `chore/<sujet>`.
2. **Petits commits ciblés.**
3. **Titre de PR au format [Conventional Commits](https://www.conventionalcommits.org/)** :
   `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `refactor:`… Ce format pilote le
   versioning automatique (release-please) et le `CHANGELOG`.
4. **Avant de pousser** :
   - `make validate` passe ;
   - `make scan` ne relève aucune alerte HIGH/CRITICAL ;
   - aucun secret en clair (utilisez **SOPS** — voir `.sops.yaml`).
5. **Ouvrez la PR** vers `main`. La CI doit être verte.
6. **Revue obligatoire** : toute PR vers `main` requiert l'approbation du
   [CODEOWNERS](.github/CODEOWNERS) (`@wbatchayon`) avant merge — voir la règle
   « Protect main ». Aucun push direct sur `main`.

## Conventions de commit (résumé)

| Préfixe | Effet release-please |
|---------|----------------------|
| `feat:` | bump *minor* |
| `fix:` | bump *patch* |
| `docs:`/`chore:`/`ci:`/`refactor:` | pas de bump (changelog « divers ») |
| `feat!:` ou `BREAKING CHANGE:` | bump *major* |

## Style

- Suivez les conventions du code existant (nommage, indentation, langue FR des commentaires).
- YAML conforme à `.yamllint.yaml` ; Terraform formaté (`terraform fmt -recursive`).
- Documentez tout changement de comportement dans `docs/`.

## GitOps

- Les manifests `platform/` sont réconciliés par Flux ; respectez l'ordre via
  `spec.dependsOn` (security → storage → backends → reste).
- Toute valeur spécifique à un environnement passe par `environments/<env>/`
  (jamais codée en dur dans `platform/`).

## Signaler un bug / proposer une fonctionnalité

Ouvrez une issue via les modèles `.github/ISSUE_TEMPLATE/`. Pour une faille de
sécurité, suivez [SECURITY.md](SECURITY.md) (ne créez pas d'issue publique).

## Code de conduite

Ce projet adhère au [Code de conduite](CODE_OF_CONDUCT.md).
