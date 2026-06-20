# 📊 Plateforme d'Observabilité — Reproductible, Sécurisée, GitOps

> 100% open source · stack Grafana (Loki / Mimir / Tempo / Grafana) · OpenTelemetry · FluxCD · DevSecOps

Plateforme d'observabilité déployable **à l'identique dans n'importe quel environnement**.
Le principe : **vous changez uniquement les valeurs/credentials d'un environnement, puis vous lancez.**

---

## 🎯 Principe « change credentials & launch »

Toute la variabilité (credentials, domaines, sizing, endpoints) vit dans `environments/<env>/`.
Le reste du code est strictement identique d'un environnement à l'autre.

```bash
# 1. Créer un nouvel environnement à partir du template
cp -r environments/_template environments/prod

# 2. Remplir les valeurs et chiffrer les secrets
$EDITOR environments/prod/*.tfvars environments/prod/*.values.yaml
make encrypt ENV=prod          # chiffre les secrets via SOPS

# 3. Provisionner le socle puis déployer la plateforme
make bootstrap ENV=prod        # cluster -> Vault -> Flux -> dépôt packages
make deploy    ENV=prod        # FluxCD réconcilie la plateforme

# 4. Configurer les agents sur les VMs (air-gap)
ansible-playbook -i ansible/inventories/prod ansible/playbooks/install-agent.yaml
```

---

## 🏗️ Architecture

```
VMs (agent OTel, air-gap) ──OTLP/mTLS──▶ Edge Collector (par DC)
   ──▶ HAProxy/LB (TLS) ──▶ OTel Gateway x3 (filter/batch/enrich/sampling/queues)
        ├─ logs    ─▶ Loki  ─┐
        ├─ metrics ─▶ Mimir ─┼─▶ MinIO (S3 long terme)
        └─ traces  ─▶ Tempo ─┘
                         └─▶ Grafana (visualisation unifiée)
Prometheus ─▶ Alertmanager ─▶ OneUptime ─▶ GLPI + notifications
```

Détails : [`docs/architecture/`](docs/architecture/) · fonctionnement : [`docs/how-it-works/`](docs/how-it-works/).

---

## 📁 Structure du dépôt

| Dossier | Rôle |
|---|---|
| `environments/` | **Seule surface de configuration** — `_template` + `dev`/`staging`/`prod` |
| `bootstrap/` | Terraform : `00-cluster`, `10-vault`, `20-flux`, `30-package-repo` |
| `platform/` | HelmReleases FluxCD : `security`, `storage`, `backends`, `ingestion`, `monitoring`, `visualization`, `incident` |
| `ingress/` | HAProxy/LB + terminaison TLS |
| `ansible/` | Gestion des agents OTel sur VMs air-gap |
| `ci/` | Scripts de validation/scan réutilisés par le `Makefile` et la CI |
| `docs/` | Architecture, runbooks, how-it-works, schémas (`docs/imgs/`) |

---

## ✅ Prérequis

- **Kubernetes** 1.25+ (provisionné par `bootstrap/00-cluster`, défaut kubeadm on-prem)
- Outils CLI : `terraform` ≥ 1.6, `flux`, `helm`, `kubectl`, `ansible`, `sops` + `age`
- Outils de validation (CI) : `yamllint`, `tflint`, `kubeconform`, `trivy`, `checkov`, `gitleaks`, `kubescape`
- Un dépôt Git (la plateforme est pilotée par GitOps via PR — voir [`docs/how-it-works/git-workflow.md`](docs/how-it-works/git-workflow.md))

---

## 🔐 Sécurité (DevSecOps)

- **mTLS de bout en bout** via Vault PKI + cert-manager (agent → edge → LB → gateway → backends)
- **Secrets** chiffrés dans Git (SOPS+age), un trousseau par environnement
- **NetworkPolicies** deny-by-default, **RBAC** strict, **Kyverno** (admission)
- **Supply chain** : dépôt interne, scan Trivy, SBOM (syft) + signature Cosign
- **CI bloquante** : lint + scans + policy-as-code sur chaque PR

---

## 🛠️ Commandes

```bash
make help            # liste des cibles
make validate ENV=dev    # lint + kubeconform + terraform validate
make scan                # trivy / checkov / gitleaks / kubescape
make bootstrap ENV=dev   # provisionne le socle
make deploy ENV=dev      # réconcilie la plateforme via Flux
```

---

*Auteur : William BATCHAYON*
