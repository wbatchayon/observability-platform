# Rôle `otel-agent`

Installe et configure l'agent **OpenTelemetry Collector** (`otelcol-contrib`) sur les VMs
Linux (Debian/RHEL) et Windows, en **air-gap**. La configuration se compose de deux couches :

1. **Le socle commun** — collecté partout, identique pour toutes les machines.
2. **Un profil d'équipe** (optionnel, *data-driven*) — ajoute les receivers/logs métier propres
   à un domaine (Database, Network, Kubernetes…), **sans jamais dupliquer ni modifier le socle**.

À quoi s'ajoute l'**enrichissement CMDB** : des attributs du parc (propriétaire, code appli,
astreinte…) attachés à toute la télémétrie pour la recherche et la corrélation dans Grafana.

> Les besoins d'origine sont dans `besoins/Observabilité - Besoins détaillé.xlsx` (métriques/logs
> par domaine) et `besoins/Besoin_securité.xlsx` (sources de logs pour la détection MITRE ATT&CK).

---

## 1. Architecture de la configuration générée (`config.yaml.j2`)

```
receivers ──────────────┐
  socle : hostmetrics, otlp(mTLS 0.0.0.0:4317/4318), filelog, filelog/security,
          journald | windowseventlog(application/system/security), prometheus/internal
  profil : <injectés depuis profiles/<nom>.yaml>            (snmp, sqlquery, prometheus, k8s_*, syslog…)
                        │
processors ─────────────┤  memory_limiter → resourcedetection → resource(*) → filter/self(logs) → batch
  (*) resource = host.name, environment, team, domain, criticality, retention_class,
                 + attributs de profil + attributs CMDB (otel_cmdb_attributes)
                        │
exporters ──────────────┘  otlp/gRPC gzip mTLS → Edge Collector du DC  (file persistante + retry)

pipelines : metrics / logs / traces  (chacun = receivers socle + receivers profil)
```

Le socle et sa sécurité (mTLS, anti-boucle `filter/self`, file persistante `file_storage`,
drop-in systemd) sont documentés dans `docs/architecture/data-flow.md`.

---

## 2. Le contrat de profil (data-driven)

Un profil est un **fichier de variables Ansible** dans `profiles/<nom>.yaml`, chargé
automatiquement quand `otel_profile` est défini (`tasks/main.yaml` → `include_vars`).
Il définit uniquement ces variables ; le template les injecte et les branche aux pipelines :

| Variable | Type | Rôle |
|---|---|---|
| `otel_team`, `otel_domain` | str | Étiquettes d'équipe/domaine (attributs de ressource) |
| `otel_criticality`, `otel_retention_class` | str | Classe de criticité / rétention (routage aval) |
| `otel_profile_receivers` | dict | `{nom_receiver: {config OTel}}` injecté sous `receivers:` |
| `otel_profile_metrics_receivers` | list | Noms branchés au pipeline **metrics** |
| `otel_profile_logs_receivers` | list | Noms branchés au pipeline **logs** |
| `otel_profile_traces_receivers` | list | Noms branchés au pipeline **traces** |
| `otel_profile_resource_attributes` | list | `[{key, value, action}]` attributs additionnels |
| `otel_profile_firewall_ports` | list | `[{port, proto}]` à ouvrir (receivers en écoute, ex. syslog) |

Profils fournis : `database`, `network`, `virtualisation`, `storage`, `backup-restore`,
`orchestration`, `observabilite`, `kubernetes`.

### Ajouter une nouvelle équipe / un nouveau profil

1. Créer `profiles/<nom>.yaml` en respectant le contrat ci-dessus (receivers **uniquement**
   présents dans `otelcol-contrib` ; secrets via `{{ vault_* }}`, jamais en clair).
2. Dans l'inventaire, créer le groupe `team_<nom>` (`hosts.yaml`) et `group_vars/team_<nom>.yaml`
   avec `otel_profile: <nom>` + les endpoints non-secrets.
3. Ajouter les secrets dans `group_vars/all/vault.yaml` (chiffré SOPS).
4. Valider localement (cf. §6), puis déployer.

Aucune modification du template ni du socle n'est nécessaire.

---

## 3. Enrichissement CMDB

`otel_cmdb_attributes` (dict `{clé: valeur}`, défini en `host_vars/<hôte>.yaml`) est attaché à
**toute** la télémétrie de l'hôte. Objectif Grafana : filtrer/corréler par `app.code`,
`cmdb.owner`, `cmdb.datacenter`, `oncall.team`, `service.name`… sur métriques **et** logs
**et** traces (attributs de ressource communs). Gabarit :
`inventories/_template/host_vars/vm-debian-01.example.yaml`.

**Astreinte** : `oncall.team` (rotation, stable) est porté par l'agent ; la personne d'astreinte
vivante est résolue **en aval** (Alertmanager → OneUptime/Opsgenie), jamais figée dans la config
(sinon redéploiement à chaque rotation). Détail : `inventories/_template/README.md`.

À l'échelle : générer les `host_vars` depuis l'API CMDB (job/inventaire dynamique) puis relancer
`configure-agent.yaml` — les attributs reflètent alors la CMDB à chaque synchronisation.

---

## 4. Sécurité (détection MITRE ATT&CK)

Les sources de logs sensibles (auth/brute-force, kernel, audit, changements de conf, et les logs
métier de chaque profil) sont taguées `resource["log.category"]="security"` pour un routage et
une rétention dédiés côté Gateway/SIEM. Socle : `filelog/security` (Linux) et
`windowseventlog/security` (Windows). Par domaine : voir chaque `profiles/<nom>.yaml`.

---

## 5. Variables du rôle (`defaults/main.yaml`)

| Variable | Défaut | Rôle |
|---|---|---|
| `otel_open_firewall` | `true` | Ouvre les ports sur le pare-feu de la VM |
| `otel_otlp_ports` | `[4317, 4318]` | Ports du receiver OTLP (socle) |
| `otel_team` / `otel_domain` | `unassigned` / `socle-commun` | Étiquettes par défaut (surchargées par profil) |
| `otel_criticality` / `otel_retention_class` | `medium` / `standard` | Classe par défaut |
| `otel_cmdb_attributes` | `{}` | Attributs CMDB (host_vars) |
| `otel_collect_process_metrics` | `false` | Scraper `process` (Top process CPU/RAM) — coûteux |
| `otel_security_log_paths_linux` | (auth/secure/kern/audit/dpkg/yum/dnf) | Sources sécurité Linux |
| `otel_profile*` | vides | Contrat de profil (cf. §2) |

---

## 6. Validation locale (avant déploiement)

Le template doit rendre un YAML valide et brancher chaque receiver de profil. Exemple de
contrôle (rendu Jinja + `to_nice_yaml` + parsing) : pour chaque `profiles/*.yaml`, superposer
`defaults` + `group_vars` + profil + `host_vars`, rendre `config.yaml.j2`, puis `yaml.safe_load`
et vérifier que tout nom listé dans `otel_profile_*_receivers` existe sous `receivers:`.

> La validation porte sur le **rendu YAML et le câblage**, pas sur le comportement d'un collector
> live : OID SNMP, requêtes `sqlquery` et endpoints sont à valider en conditions réelles.

---

## 7. Déploiement

```bash
# Installe + configure (packages offline, certs mTLS, config, service, pare-feu)
ansible-playbook -i inventories/<env>/hosts.yaml playbooks/install-agent.yaml

# Re-configure sans réinstaller (re-template + redémarrage)
ansible-playbook -i inventories/<env>/hosts.yaml playbooks/configure-agent.yaml
```

---

## 8. Limites connues (TODO explicites dans les profils)

Les technologies exposant uniquement une **API propriétaire** sans receiver `otelcol-contrib`
(FusionCompute/eDME, OceanProtect, Huawei NCE, EfficientIP) sont laissées en **receiver commenté
`TODO`** : elles nécessitent un exporter Prometheus intermédiaire. Rien n'est inventé — le SNMP et
le syslog couvrent le reste. Voir la section finale de chaque `profiles/<nom>.yaml`.
