# charts-seed - charts Helm d'amorçage (air-gap)

Harbor étant le registre lui-même, son chart ne peut pas venir de Harbor. Déposez ici, hors-ligne,
le chart Helm Harbor extrait (et tout chart nécessaire à l'amorçage avant que Harbor ne serve les
charts OCI) :

```
charts-seed/
└── harbor/        # contenu extrait de harbor-1.14.0.tgz (Chart.yaml, templates/, ...)
```

Variable Terraform associée : `charts_seed_dir` (défaut `./charts-seed`).

> Ce répertoire est intentionnellement quasi-vide dans Git : les archives de charts ne sont pas
> versionnées. Voir `docs/how-it-works/air-gap.md` pour la procédure de seed complète.
