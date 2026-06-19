# Flux de données

## Télémétrie (collecte → stockage → visualisation)

1. L'**agent OTel** (VM) collecte métriques (hostmetrics), logs (filelog/journald/windowseventlog)
   et exporte en **OTLP/gRPC mTLS** vers l'**Edge Collector** de son DC.
2. L'**Edge Collector** bufferise (file persistante), filtre, **compresse (gzip)** et exporte en
   OTLP/gRPC mTLS via l'**ingress HAProxy** (terminaison TLS) vers l'**OTel Gateway**.
3. Le **Gateway (x3)** applique le pipeline : `memory_limiter → filter → resource/attributes
   (enrichissement) → [tail_sampling pour traces] → batch`, avec **files persistantes + retry**,
   puis exporte :
   - logs → **Loki** (`loki-gateway`)
   - métriques → **Mimir** (`mimir-distributor`, remote write)
   - traces → **Tempo** (`tempo-distributor`, OTLP)
4. Loki/Mimir/Tempo persistent leurs blocks dans **MinIO (S3)**.
5. **Grafana** lit les trois backends (datasources) avec corrélation logs↔traces↔métriques.

## Alerting / incident

```
Prometheus → Alertmanager → OneUptime → GLPI (ticket) + notifications (Slack/Teams/Email/SMS)
```

## Sécurité du flux

Chaque saut (agent → edge → LB → gateway → backends) est protégé par **mTLS** via des certificats
émis par la **PKI Vault** (cert-manager / `vault-issuer`). Cf. `docs/imgs/security.mmd`.
