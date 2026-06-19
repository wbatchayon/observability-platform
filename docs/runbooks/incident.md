# Runbook — Incident

## Réception
Alertmanager → OneUptime crée un ticket GLPI et notifie (Slack/Teams/Email/SMS) selon la sévérité.

## Triage rapide
1. Identifier le composant (label `namespace`/`alertname`).
2. Grafana → dashboard "Santé des composants".
3. `kubectl -n <ns> get pods` ; logs : `kubectl -n <ns> logs <pod>`.

## Cas fréquents
| Symptôme | Piste |
|---|---|
| `OtelGatewayDown` | replicas gateway, certs mTLS expirés, backpressure backends |
| `OtelQueueSaturation` | backends lents/saturés ; KEDA scale-out automatique ; vérifier MinIO |
| `LokiIngestionErrors` | quotas/limits Loki, connectivité S3 |
| `MimirIngesterUnhealthy` | PV pleins, réplication, ressources |
| `PodCrashLooping` | `kubectl describe pod`, events, OOM |

## Escalade
Critique non résolu en 15 min → escalade équipe SRE (canal `#sre-oncall`).
