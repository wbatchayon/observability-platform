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

**Alertmanager est le point central**, il remonte vers **OneUptime** qui crée les tickets **GLPI**
et **notifie Slack** pour les problèmes majeurs (astreinte).

```
Prometheus → Alertmanager (central) → OneUptime → GLPI (ticket)
                                              └──→ Slack (astreinte, si majeur)
```

**Failover** : OneUptime surveille Alertmanager ; s'il est indisponible (panne/maintenance),
OneUptime **prend le relais** (alerting de secours via ses propres sondes) puis repasse en relais
au rétablissement. Voir `platform/incident/integration.md`.

## Sécurité du flux

Chaque saut (agent → edge → LB → gateway → backends) est protégé par **mTLS** via des certificats
émis par la **PKI Vault** (cert-manager / `vault-issuer`). Cf. `docs/imgs/security.mmd`.
