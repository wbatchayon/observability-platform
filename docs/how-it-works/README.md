# Comment fonctionne le projet (de bout en bout)

## 1. Vous configurez un environnement

Tout ce qui change entre environnements vit dans `environments/<env>/` :

- `*.tfvars` — paramètres du socle Terraform (cluster, Vault, Flux, Harbor).
- `env-values.yaml` — variables non sensibles (ConfigMap `env-values`).
- `secrets.sops.yaml` — secrets chiffrés SOPS (Secret `env-secrets`).

```bash
cp -r environments/_template environments/prod
$EDITOR environments/prod/*          # remplir
make encrypt ENV=prod                # chiffrer les secrets
```

## 2. Vous provisionnez le socle

```bash
make bootstrap ENV=prod
```

Exécute Terraform dans l'ordre : **cluster** (kubeadm) → **Vault** (PKI/mTLS, auth) → **FluxCD**
(connexion au dépôt Git) → **Harbor** (dépôt de packages OTel).

## 3. FluxCD déploie la plateforme

```bash
make deploy ENV=prod
```

Flux réconcilie `platform/` en injectant l'overlay `environments/prod` (via
`postBuild.substituteFrom`). Sont déployés : sécurité (cert-manager + `vault-issuer`,
NetworkPolicies, Kyverno) → stockage (MinIO) → backends (Loki/Mimir/Tempo) → ingestion (OTel
Gateway + Edge) → monitoring (Prometheus/Alertmanager) → visualisation (Grafana) → incident
(OneUptime/GLPI) → ingress (HAProxy).

## 4. Vous déployez les agents sur les VMs

```bash
ansible-playbook -i ansible/inventories/prod ansible/playbooks/install-agent.yaml
```

Les agents (air-gap) tirent le package OTel depuis Harbor et exportent en OTLP/mTLS vers l'Edge.

## 5. Exploitation

- **Grafana** : dashboards + corrélation logs/traces/métriques.
- **Alertes** : Prometheus → Alertmanager → OneUptime → GLPI + notifications.
- **Évolutions** : par **Pull Request** (CI bloquante) — voir [git-workflow](git-workflow.md).

## Reproductibilité

Le même code produit n'importe quel environnement. Pour un nouvel environnement, on **copie
`_template`, on remplit les credentials, et on lance** — rien d'autre à modifier.
