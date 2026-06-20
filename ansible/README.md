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
- `roles/common` - utilisateur de service, répertoires, détection OS.
- `roles/otel-agent` - installation offline (Debian/RHEL/Windows), certificats mTLS, template de
  config (`config.yaml.j2`), service systemd / Windows, handlers de redémarrage.
- `playbooks/install-agent.yaml` - installe + configure.
- `playbooks/configure-agent.yaml` - re-configure sans réinstaller.

## Variables clés (`inventories/<env>/group_vars/all.yaml`)

`package_repo_url`, `otel_version` (0.148.0), `edge_collector_endpoint`, certificats mTLS
(`vault_otel_tls_*` via ansible-vault/SOPS - jamais en clair).

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
