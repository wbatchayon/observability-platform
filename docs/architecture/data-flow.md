# Flux de données

## Télémétrie (collecte → stockage → visualisation)

1. L'**agent OTel** (VM) collecte métriques (hostmetrics : cpu/mem/disk/fs/net/load/paging/processes
   + auto-télémétrie du collector), logs (filelog/journald/windowseventlog application+system) et
   **traces/métriques/logs applicatifs** via un receiver OTLP exposé sur le réseau (0.0.0.0:4317/4318)
   en **mTLS** (mêmes certifs PKI que l'export : tout client doit présenter un cert signé par la CA interne).
   Offsets de lecture persistés (file_storage) pour ne rien perdre au redémarrage, et filtre
   anti-boucle pour ne pas réingérer ses propres logs. Il exporte en **OTLP/gRPC mTLS** vers
   l'**Edge Collector** de son DC.
   > Le durcissement systemd (LimitNOFILE, Restart) passe par un **drop-in**
   > `otelcol-contrib.service.d/override.conf` — l'unité packagée n'est jamais éditée (elle serait
   > écrasée au prochain upgrade du package).
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
