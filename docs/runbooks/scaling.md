# Runbook — Scaling

Toute mise à l'échelle se fait **par PR** sur `environments/<env>/env-values.yaml`.

| Composant | Variable | Déclencheur |
|---|---|---|
| OTel Gateway | `OTEL_GATEWAY_REPLICAS` (+ KEDA auto) | latence/saturation file |
| Loki | `LOKI_INGESTER_REPLICAS` | volume de logs |
| Mimir | `MIMIR_INGESTER_REPLICAS` | nombre de séries |
| Tempo | `TEMPO_INGESTER_REPLICAS` | volume de spans |
| MinIO | `MINIO_REPLICAS` / `MINIO_VOLUME_SIZE` | capacité stockage |
| Prometheus | rétention/ressources | charge mémoire |

## Procédure
1. Modifier la valeur dans `environments/<env>/env-values.yaml`.
2. Ouvrir une PR ; la CI valide ; merge.
3. Flux réconcilie ; vérifier `flux get helmreleases -A`.

> Le gateway dispose d'un auto-scaling KEDA (saturation de file) entre `OTEL_GATEWAY_REPLICAS` et 10.
