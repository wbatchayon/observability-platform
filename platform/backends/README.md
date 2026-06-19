# platform/backends — Backends de télémétrie (Loki / Mimir / Tempo)

**Brique de référence** (structure et conventions suivies par les autres briques `platform/`).
Stocke logs, métriques et traces dans MinIO et expose les endpoints d'écriture et de lecture.

## Composants

| Composant | Signal | Chart | Stockage |
|---|---|---|---|
| Loki | logs | `grafana/loki` (distributed) | bucket `loki` |
| Mimir | métriques | `grafana/mimir-distributed` | bucket `mimir` |
| Tempo | traces | `grafana/tempo-distributed` | bucket `tempo` |

## Produit (endpoints internes)

**Écriture (consommés par platform/ingestion)** :
- Loki push : `http://loki-gateway.backends.svc.cluster.local/loki/api/v1/push`
- Mimir push : `http://mimir-distributor.backends.svc.cluster.local/api/v1/push`
- Tempo OTLP gRPC : `tempo-distributor.backends.svc.cluster.local:4317`

**Lecture (consommés par platform/visualization — datasources Grafana)** :
- Loki : `http://loki-gateway.backends.svc.cluster.local`
- Mimir : `http://mimir-query-frontend.backends.svc.cluster.local/prometheus`
- Tempo : `http://tempo-query-frontend.backends.svc.cluster.local:3100`

## Consomme

- MinIO S3 (`platform/storage`) : endpoint `minio.storage.svc.cluster.local:9000`, buckets,
  secret `minio-credentials` (recréé dans `backends` via substitution Flux).
- `ClusterIssuer` `vault-issuer` pour le mTLS interne.
- `environments/<env>/backends.values.yaml` : rétentions (`LOKI_RETENTION`, `MIMIR_RETENTION`,
  `TEMPO_RETENTION`), replicas d'ingesters, multi-tenancy.

## Caractéristiques

- **Multi-tenant** (`auth_enabled`/`multitenancy_enabled`) → isolation par équipe/projet.
- Réplication (zone-aware pour Mimir), compaction, rétention configurables par environnement.
