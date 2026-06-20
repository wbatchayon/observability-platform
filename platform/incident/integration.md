# Intégration de la gestion d'incidents

Flux de bout en bout :

```
Prometheus ─(alerte)─▶ Alertmanager ─(webhook)─▶ OneUptime ─(API)─▶ GLPI (ticket)
                                                      └─(routing)─▶ Notifications (Slack/Teams/Email/SMS)
```

1. **Alertmanager → OneUptime** : les alertes sont postées sur
   `http://oneuptime.incident.svc.cluster.local/api/alertmanager-webhook` (cf.
   `platform/monitoring/alertmanager.yaml`).
2. **OneUptime → GLPI** : OneUptime crée automatiquement un ticket via l'API REST de GLPI
   (service `glpi.incident.svc`). Configurer un App-Token + User-Token GLPI côté OneUptime.
3. **OneUptime → Notifications** : selon `notification-routing` (ConfigMap), OneUptime déclenche
   les canaux par sévérité/équipe (tokens dans le secret `notification-tokens`).

## Configuration requise

- Côté GLPI : activer l'API REST, générer App-Token, créer un compte de service.
- Côté OneUptime : workspace, projet, intégration webhook entrante + intégration GLPI sortante.
- Secrets (`environments/<env>/incident.values.yaml`, SOPS) : tokens GLPI, webhooks Slack/Teams,
  SMTP.
