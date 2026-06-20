# Description

<!-- Décrivez le changement et la motivation. Liez l'issue : Closes #__ -->

## Type de changement

- [ ] feat — nouvelle fonctionnalité
- [ ] fix — correction de bug
- [ ] docs — documentation
- [ ] chore / ci — outillage, pipeline
- [ ] refactor — sans changement de comportement

## Environnements impactés

- [ ] dev
- [ ] staging
- [ ] prod

## Checklist

- [ ] Le titre de la PR suit les **Conventional Commits** (`feat:`, `fix:`, `docs:`…)
- [ ] `make validate` passe en local (lint + kubeconform + terraform validate)
- [ ] `make scan` ne relève aucune alerte HIGH/CRITICAL
- [ ] Aucun secret en clair (SOPS utilisé pour toute donnée sensible)
- [ ] Documentation mise à jour (`docs/`) si nécessaire
- [ ] Le `CODEOWNERS` concerné a été sollicité pour revue

## Notes GitOps

<!-- Diff Flux / plan Terraform attendu, impacts de réconciliation, ordre de déploiement -->
