# ansible - Gestion du fleet de VMs (agents OpenTelemetry, air-gap)

Industrialise l'installation et la configuration des agents OTel sur les VMs Linux (Debian/RHEL)
et Windows. **Les VMs sont air-gap** : les packages sont tirés depuis le dépôt interne
(Harbor/Nexus, `bootstrap/30-package-repo`), jamais depuis Internet.

## Flux

```
Dépôt interne (apt/yum/tar.gz) ──install offline──▶ Agent OTel sur VM
   agent ──OTLP/gRPC mTLS──▶ Edge Collector (otlp.<env>.observability.internal:4317)
```

## Structure

- `inventories/<env>/` - hôtes + `group_vars` (la surface de configuration par environnement).
  Voir `inventories/_template/README.md` (groupes OS × équipe, secrets SOPS, CMDB).
- `roles/common` - utilisateur de service, répertoires, détection OS.
- `roles/otel-agent` - installation offline (Debian/RHEL/Windows), certificats mTLS, template de
  config (`config.yaml.j2`), **profils de collecte par équipe** (`profiles/`) et enrichissement
  CMDB, service systemd / Windows, handlers. **Référence technique : `roles/otel-agent/README.md`.**
- `playbooks/install-agent.yaml` - installe + configure.
- `playbooks/configure-agent.yaml` - re-configure sans réinstaller.

## Collecte : socle + profils par équipe

L'agent collecte un **socle commun** (hostmetrics, logs OS + sécurité, receiver OTLP mTLS) sur
toutes les machines, auquel s'ajoute un **profil d'équipe** *data-driven* (`otel_profile`) qui
injecte les receivers/logs métier du domaine (Database, Network, Storage, Virtualisation,
Backup, Orchestration, Observabilité, Kubernetes) **sans dupliquer le socle**. Chaque hôte est
placé dans un groupe OS **et** un groupe `team_*`. Détail du contrat de profil, ajout d'une
équipe, sécurité (tag `log.category=security`) et CMDB : **`roles/otel-agent/README.md`**.

## Variables clés (`inventories/<env>/group_vars/`)

Dans `all/main.yaml` : `package_repo_url`, `otel_version` (0.148.0), `edge_collector_endpoint`.
Dans `all/vault.yaml` (**chiffré SOPS**, jamais en clair) : certificats mTLS `vault_otel_tls_*`
et secrets des profils (`vault_db_*`, `vault_snmp_*`…). Dans `team_<équipe>.yaml` : `otel_profile`
+ endpoints non-secrets. Dans `host_vars/<hôte>.yaml` : attributs CMDB (`otel_cmdb_attributes`).
Ports OTLP ouverts sur le pare-feu : `otel_otlp_ports` (4317/4318), désactivable via
`otel_open_firewall: false` ; les receivers en écoute des profils (syslog) ouvrent leurs ports
via `otel_profile_firewall_ports`.

### Certificat de l'agent (exigences d'émission)

Le receiver OTLP local écoute en **mTLS sur `0.0.0.0:4317/4318`** : l'agent est à la fois
**client** (export vers l'edge) et **serveur** (réception des applis/conteneurs). Le certificat
émis par la **PKI Vault** (`pki_int/sign/observability`) et injecté dans `vault_otel_tls_cert`
doit donc porter :

- EKU **`server auth` + `client auth`** (comme les certifs edge/gateway, cf. `platform/ingestion/certificate.yaml`) ;
- des **SAN** correspondant à l'adressage des clients : hostname **et/ou IP** de la VM
  (`dnsNames` / `ipAddresses`), sinon la vérification TLS échoue côté client.

## Utilisation

```bash
# Installer les agents pour un environnement
ansible-playbook -i inventories/dev playbooks/install-agent.yaml

# Reconfigurer sans réinstaller
ansible-playbook -i inventories/dev playbooks/configure-agent.yaml

# Validation
ansible-lint
ansible-playbook -i inventories/dev playbooks/install-agent.yaml --syntax-check
```

## Réutilisation

Industrialise les scripts manuels de référence
`VM_Configuration/Manuelle/{bash,powershell}/` en rôles idempotents multi-OS.
