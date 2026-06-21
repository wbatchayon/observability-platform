[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

# Plateforme d'Observabilité — Reproductible, Sécurisée, GitOps

> 100% open source · stack Grafana (Loki / Mimir / Tempo / Grafana) · OpenTelemetry · FluxCD · DevSecOps

Plateforme d'observabilité déployable **à l'identique dans n'importe quel environnement**.
Le principe : **vous changez uniquement les valeurs/credentials d'un environnement, puis vous lancez.**

---

## Principe « change credentials & launch »

Toute la variabilité (credentials, domaines, sizing, endpoints) vit dans `environments/<env>/`.
Le reste du code est strictement identique d'un environnement à l'autre.

```bash
# 1. Créer un nouvel environnement à partir du template
cp -r environments/_template environments/prod

# 2. Remplir les valeurs et chiffrer les secrets
$EDITOR environments/prod/*.tfvars environments/prod/*.values.yaml
make encrypt ENV=prod          # chiffre les secrets via SOPS

# 3. Provisionner le socle puis déployer la plateforme
make preflight ENV=prod        # vérifie les prérequis du cluster cible
make bootstrap ENV=prod        # cluster -> Harbor -> Vault -> Flux
make deploy    ENV=prod        # FluxCD réconcilie la plateforme

# 4. Configurer les agents sur les VMs (air-gap)
ansible-playbook -i ansible/inventories/prod ansible/playbooks/install-agent.yaml
```

---

## Architecture

```
VMs (agent OTel, air-gap) ──OTLP/mTLS──▶ Edge Collector (par DC)
   ──▶ HAProxy/LB (TLS) ──▶ OTel Gateway x3 (filter/batch/enrich/sampling/queues)
        ├─ logs    ─▶ Loki  ─┐
        ├─ metrics ─▶ Mimir ─┼─▶ MinIO (S3 long terme)
        └─ traces  ─▶ Tempo ─┘
                         └─▶ Grafana (visualisation unifiée) ─▶ OneUptime ─▶ GLPI + notifications
Prometheus ─▶ Alertmanager ─▶ OneUptime ─▶ GLPI + notifications
```

Détails : [`docs/architecture/`](docs/architecture/) · fonctionnement : [`docs/how-it-works/`](docs/how-it-works/).

---

## Prérequis

- **Kubernetes** 1.25+ — provisionné par `bootstrap/00-cluster` (kubeadm on-prem)
  ou cluster existant (Rancher/RKE2/k3s, EKS/GKE/AKS, Talos…) ciblé par kubeconfig.
- **StorageClass par défaut** (ou `STORAGE_CLASS`), **LoadBalancer** (ou `LB_SERVICE_TYPE=NodePort`),
  **CNI compatible NetworkPolicy**. Matrice des distributions : [`docs/how-it-works/portability.md`](docs/how-it-works/portability.md).
- **Dimensionnement / ressources minimales** (CPU/RAM/stockage par composant, profils POC & prod) :
  [`docs/architecture/requirements.md`](docs/architecture/requirements.md).
- Outils CLI : `terraform` ≥ 1.6, `flux`, `helm`, `kubectl`, `ansible`, `sops` + `age`
- Outils de validation (CI) : `yamllint`, `tflint`, `kubeconform`, `trivy`, `checkov`, `gitleaks`, `kubescape`
- Un dépôt Git (GitOps via PR — voir [`docs/how-it-works/git-workflow.md`](docs/how-it-works/git-workflow.md))

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

## Contribuer & communauté

- [Guide de contribution](CONTRIBUTING.md) · [Code de conduite](CODE_OF_CONDUCT.md)
- [Politique de sécurité](SECURITY.md) (signalement responsable des vulnérabilités)
- Licence : [Apache 2.0](LICENSE)

Toute PR vers `main` passe par la CI et l'approbation du [CODEOWNERS](.github/CODEOWNERS).

---

*Auteur : William BATCHAYON - Architecte Technique*
