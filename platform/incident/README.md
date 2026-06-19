# platform/incident — Gestion d'incidents (OneUptime + GLPI + notifications)

## Produit

- Service **`oneuptime`** (`http://oneuptime.incident.svc.cluster.local`) qui **reçoit les webhooks
  Alertmanager** sur `/api/alertmanager-webhook`.
- GLPI (+ MariaDB) pour la gestion des tickets.
- Canaux de notification configurables par sévérité/équipe.

## Flux

`Alertmanager → OneUptime → GLPI (ticket) + notifications`. Détails : [`integration.md`](integration.md).

## Consomme

`environments/<env>/incident.values.yaml` : credentials GLPI/DB (`GLPI_DB_*`), webhooks
(`SLACK_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`), SMTP — tous via SOPS.
