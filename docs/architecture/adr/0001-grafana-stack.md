# ADR 0001 - Backend = stack Grafana (Loki/Mimir/Tempo)

**Statut** : Accepté · **Date** : 2026-06-19

## Contexte

Deux pistes existaient : stack Grafana (Loki/Mimir/Tempo) vs Elasticsearch/Thanos. Le document de
référence `idée.md` cible la stack Grafana.

## Décision

Adopter **Loki (logs) + Mimir (métriques) + Tempo (traces) + Grafana**, sur stockage objet
**MinIO (S3)**. La spec OTel antérieure mentionnant Elasticsearch/Thanos est obsolète et réalignée.

## Conséquences

- Intégration native et corrélation logs/traces/métriques dans Grafana.
- 100% open source, scalabilité horizontale, multi-tenant.
- Stockage objet unique (MinIO) pour les trois signaux.
