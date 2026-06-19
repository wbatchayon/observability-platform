# platform/visualization — Grafana

Tableau de bord unifié (logs + métriques + traces) avec corrélation croisée.

## Datasources (as-code, sidecar)

| Datasource | Endpoint |
|---|---|
| Loki | `http://loki-gateway.backends.svc.cluster.local` |
| Mimir | `http://mimir-query-frontend.backends.svc.cluster.local/prometheus` |
| Tempo | `http://tempo-query-frontend.backends.svc.cluster.local:3100` |
| Prometheus | `http://prometheus-operated.monitoring.svc.cluster.local:9090` |

**Corrélation** : logs→traces (derived field Loki→Tempo), métriques→traces (exemplars
Mimir→Tempo), traces→logs (Tempo→Loki).

## Dashboards (as-code)

`overview` (débit ingestion, logs, files d'export) et `component-health` (cibles UP, erreurs 5xx).
Ajoutés via ConfigMaps labellisés `grafana_dashboard`.

## Consomme

- `ClusterIssuer` `vault-issuer` → `grafana-tls`.
- `environments/<env>/grafana.values.yaml` : `GRAFANA_DOMAIN`, OAuth (`GRAFANA_OAUTH_*`),
  admin (`GRAFANA_ADMIN_*` via SOPS), `TENANT_ID`.

## Produit

UI Grafana (`grafana.visualization.svc`), exposée en HTTPS par `ingress/`.
