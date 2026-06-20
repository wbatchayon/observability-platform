# platform/monitoring - Prometheus, Alertmanager, Auto-healing

Surveille les composants de la plateforme et route les alertes vers la gestion d'incidents.

## Cibles scrapées

OTel Gateway (`otel-gateway.ingestion.svc:8888`), backends Loki/Mimir/Tempo (ns `backends`),
MinIO (`minio.storage.svc`), cluster Kubernetes (kube-state, node, cadvisor via
kube-prometheus-stack).

## Alerting

- **Règles** (`alert-rules/`) : santé ingestion (gateway down, saturation/refus de file), backends
  (erreurs/latence Loki/Mimir/Tempo), ressources (mémoire, CrashLoop, volumes).
- **Alertmanager** : groupement + inhibition (critical inhibe warning) + routage par sévérité vers
  OneUptime : **`http://oneuptime.incident.svc.cluster.local/api/alertmanager-webhook`**.

## Auto-healing

- Kyverno `ClusterCleanupPolicy` : supprime les pods `Failed` (toutes les 15 min).
- KEDA `ScaledObject` : scale-out du gateway OTel sur saturation de la file d'export.

## Variables (`environments/<env>/monitoring.values.yaml`)

`PROMETHEUS_RETENTION`, `OTEL_GATEWAY_REPLICAS` (min pour KEDA), seuils d'alerte.
