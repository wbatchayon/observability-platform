# Inventaire template — structure

Copier ce dossier vers `inventories/<env>/`, puis renseigner hôtes, groupes d'équipe,
variables et secrets. Deux dimensions de groupes se combinent, plus une couche CMDB.

## Arborescence

```
inventories/<env>/
├── hosts.yaml                     # hôtes + appartenance aux groupes (OS et équipe)
├── group_vars/
│   ├── all/
│   │   ├── main.yaml              # variables communes (env, repo, edge collector, mTLS)
│   │   └── vault.yaml             # SECRETS (chiffré SOPS — cf. .sops.yaml)
│   ├── team_database.yaml         # otel_profile: database  + endpoints non secrets
│   ├── team_network.yaml          # otel_profile: network   + endpoints SNMP/blackbox
│   ├── team_storage.yaml
│   ├── team_virtualisation.yaml
│   ├── team_backup_restore.yaml
│   ├── team_orchestration.yaml
│   ├── team_observabilite.yaml
│   └── team_kubernetes.yaml
└── host_vars/
    └── <hôte>.yaml                # attributs CMDB (otel_cmdb_attributes) par machine
```

## Les trois couches

1. **OS** (`linux_debian` / `linux_rhel` / `windows`) → installation/packaging de l'agent.
2. **Équipe** (`team_*`) → **profil de collecte métier** via `otel_profile`. Le profil
   (`roles/otel-agent/profiles/<nom>.yaml`) injecte receivers/logs/attributs, sans toucher
   au socle. Un hôte est placé dans son groupe OS **et** dans un groupe `team_*`.
3. **CMDB** (`host_vars/<hôte>.yaml`, clé `otel_cmdb_attributes`) → attributs du parc
   attachés à toute la télémétrie de l'hôte (propriétaire, code appli, service, criticité,
   localisation, astreinte, centre de coûts…).

## Secrets

`group_vars/all/vault.yaml` regroupe tous les `vault_*`. **À chiffrer avant commit** :

```bash
sops --encrypt --in-place inventories/<env>/group_vars/all/vault.yaml
```

Le motif `inventories/.../vault*.yaml` est couvert par `.sops.yaml`. Ne jamais committer en clair.

## Enrichissement CMDB → Grafana

Objectif : dans Grafana, filtrer/corréler par `app.code`, `cmdb.owner`, `oncall.team`,
`cmdb.datacenter`, etc. sur métriques **et** logs **et** traces (attributs de ressource communs).

Deux façons d'alimenter `otel_cmdb_attributes` :

- **Statique (fourni ici)** : fichiers `host_vars/<hôte>.yaml`. Simple, versionné.
- **Synchronisé depuis la CMDB (recommandé à l'échelle)** : un job génère les `host_vars`
  (ou un inventaire dynamique / plugin de lookup) à partir de l'API CMDB, puis on relance
  `playbooks/configure-agent.yaml`. Les attributs reflètent alors la CMDB à chaque sync.

### Cas particulier de l'astreinte

`oncall.team` (l'équipe/rotation) est **stable** → attaché à l'agent. En revanche la
**personne d'astreinte à l'instant T** change quotidiennement : ne pas la figer dans la
config de l'agent (il faudrait redéployer à chaque rotation). Elle est résolue **en aval**
au moment de l'alerte (Alertmanager → OneUptime/Opsgenie, via `oncall.team`) ou à
l'affichage Grafana. L'agent porte le pointeur (`oncall.team`, `oncall.schedule_url`),
pas l'état vivant.

## Mise en service d'un environnement (checklist)

Les 4 inventaires (`_template`, `dev`, `staging`, `prod`) partagent cette structure. Pour
activer un environnement, il ne reste que de la donnée à renseigner (pas de code) :

1. **Assigner les hôtes** à leur équipe dans `hosts.yaml` : placer chaque VM dans le groupe
   `team_<équipe>` correspondant (en plus de son groupe OS). C'est ce qui déclenche le profil
   de collecte métier (`otel_profile`).
2. **Endpoints** dans `group_vars/team_<équipe>.yaml` : renseigner les cibles non-secrètes du
   profil (hôtes SNMP, cibles Prometheus, chemins de logs, endpoints /metrics…).
3. **Secrets** dans `group_vars/all/vault.yaml` : remplacer les placeholders, puis **chiffrer** :
   `sops --encrypt --in-place group_vars/all/vault.yaml`.
4. **CMDB** dans `host_vars/<hôte>.yaml` : renseigner `otel_cmdb_attributes` (ou brancher la
   synchronisation depuis l'API CMDB — cf. section ci-dessus).
5. **Déployer** : `ansible-playbook -i inventories/<env>/hosts.yaml playbooks/install-agent.yaml`
   (ou `configure-agent.yaml` pour re-configurer sans réinstaller).

Contrat de profil, ajout d'une nouvelle équipe et référence des variables :
`roles/otel-agent/README.md`.
