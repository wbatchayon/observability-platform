# Intégration de la gestion d'incidents

## Vision

**Alertmanager est le point central.** Il remonte tout vers **OneUptime**, qui :

- crée/maj les **tickets dans GLPI** ;
- **notifie Slack** en cas de problème **majeur (astreinte)**.

```
Prometheus ─(alerte)─▶ Alertmanager (central) ─(webhook)─▶ OneUptime
                                                              ├─(API)─▶ GLPI (ticket)
                                                              └─(majeur/astreinte)─▶ Slack
```

## Flux nominal

1. **Prometheus → Alertmanager** : règles PromQL déclenchées.
2. **Alertmanager → OneUptime** : webhook sur
   `http://oneuptime.incident.svc.cluster.local/api/alertmanager-webhook`.
3. **OneUptime → GLPI** : création automatique du ticket via l'API REST GLPI.
4. **OneUptime → Slack** : notification de l'astreinte si sévérité **majeure** (cf.
   `notification-routing` : `critical → slack/teams/email/sms`).

## Failover (OneUptime prend le relais d'Alertmanager)

OneUptime surveille en continu les composants — **dont Alertmanager lui-même**. Si Alertmanager
est **DOWN** (panne ou maintenance planifiée) :

1. OneUptime bascule en **alerting de secours** : ses propres sondes deviennent la source d'alerte ;
2. il continue de créer les tickets GLPI et de notifier l'astreinte Slack ;
3. au **rétablissement** d'Alertmanager, OneUptime repasse en mode **relais** et stoppe l'alerting
   direct (pas de doublon).

Configuration : `failover.yaml` (ConfigMap `oneuptime-failover`).

## Configuration requise

- **GLPI** : API REST activée, App-Token + compte de service.
- **OneUptime** : webhook entrant (Alertmanager), intégration sortante GLPI, intégration **Slack**
  (astreinte), sondes de secours (`oneuptime-failover`).
- **Secrets** (`env-secrets`, SOPS) : tokens GLPI, `SLACK_WEBHOOK_URL`, SMTP, etc.
