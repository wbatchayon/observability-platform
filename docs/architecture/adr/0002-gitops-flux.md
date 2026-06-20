# ADR 0002 - GitOps avec FluxCD + workflow Pull Request

**Statut** : Accepté · **Date** : 2026-06-19

## Contexte

La plateforme doit être reproductible et auditable, sans `kubectl apply` manuel.

## Décision

Utiliser **FluxCD** comme moteur GitOps. Git est la source de vérité ; `main` (protégée)
représente la prod ; toute évolution passe par **Pull Request** avec CI bloquante, `CODEOWNERS`,
conventional commits. Promotion `dev → staging → prod` par PR. Variabilité par environnement
injectée via `postBuild.substituteFrom`.

## Conséquences

- Réconciliation continue + drift detection + image automation par PR.
- Le même code `platform/` produit chaque environnement (overlay `environments/<env>`).
- Terraform reste pour le socle (cluster, Vault, Flux bootstrap, Harbor).
