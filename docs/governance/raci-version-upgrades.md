# RACI — Gestion des montées de version des outils

Cadre de responsabilités pour les mises à jour de tous les composants de la plateforme.
Légende : **R** = Responsible (exécute) · **A** = Accountable (rend des comptes, 1 seul) ·
**C** = Consulted (consulté) · **I** = Informed (informé).

Rôles (alignés sur [`.github/CODEOWNERS`](../../.github/CODEOWNERS)) : **Platform Lead** (A par
défaut), **infra-team**, **platform-team**, **security-team**, **observability-team**, **sre-team**,
**network-team**, **CAB** (Change Advisory Board, pour la prod et les majeures).

---

## 1. RACI par composant / outil

| Composant | Suivi version | infra | platform | security | observability | sre | network | Accountable |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|---|
| Kubernetes (kubeadm) | Renovate/manuel | **R** | C | C | I | C | C | Platform Lead |
| Vault + PKI | Renovate | C | C | **R** | I | I | — | Security Lead |
| FluxCD | Renovate | I | **R** | C | C | I | — | Platform Lead |
| cert-manager | Renovate | I | C | **R** | I | I | — | Security Lead |
| Kyverno + policies | Renovate | I | C | **R** | I | I | — | Security Lead |
| Harbor (registre) | Renovate | **R** | C | C | I | I | — | Platform Lead |
| MinIO | Renovate | C | **R** | C | C | I | — | Platform Lead |
| Loki / Mimir / Tempo | Renovate | I | C | I | **R** | C | — | Obs. Lead |
| Grafana | Renovate | I | I | C | **R** | C | — | Obs. Lead |
| Prometheus / Alertmanager | Renovate | I | I | I | **R** | C | — | Obs. Lead |
| OTel Collector (gateway/edge) | Renovate | C | I | C | **R** | C | — | Obs. Lead |
| OTel Agent (VMs, Ansible) | manuel/Nexus | **R** | I | C | C | C | — | Infra Lead |
| HAProxy / Ingress | Renovate | I | C | C | I | I | **R** | Network Lead |
| OneUptime / GLPI | Renovate | I | C | I | C | **R** | — | SRE Lead |
| Outils CI/CD (trivy, cosign, syft, checkov…) | Renovate | I | **R** | C | I | I | — | Platform Lead |
| Terraform + providers | Renovate | **R** | C | C | I | I | — | Platform Lead |
| Ansible + collections | Renovate | **R** | I | C | I | I | — | Infra Lead |

> L'« Accountable » nominal est porté par le lead de l'équipe **R**. Le **CAB** devient Accountable
> pour toute promotion en **production** et toute montée **majeure** (cf. §2/§3).

---

## 2. RACI par étape du processus de montée de version

| Étape | infra | platform | security | obs. | sre | network | CAB | Renovate (auto) |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Détection nouvelle version | I | I | I | I | I | I | I | **R** |
| Analyse changelog / breaking changes | C | C | C | C | C | C | I | équipe **R** du composant |
| Mise à jour & test en **dev** | * | * | * | * | * | * | I | — |
| Scan sécurité (trivy/checkov/cosign) | I | C | **R** | I | I | I | I | (CI) |
| Validation fonctionnelle dev | * | * | C | * | C | * | I | — |
| Promotion **staging** (PR) | * | * | C | * | C | * | I | — |
| Tests de non-régression staging | I | C | C | C | **R** | I | I | — |
| Promotion **production** (PR) | * | * | C | * | C | * | **A** | — |
| Surveillance post-déploiement | I | C | I | C | **R** | I | I | — |
| **Rollback** si échec | * | * | C | * | **A** | * | I | (Flux/git revert) |

`*` = l'équipe **R** propriétaire du composant (cf. §1) exécute l'étape pour son composant.

---

## 3. Politique de cadence et d'approbation

| Type de mise à jour | Déclencheur | Approbation | Délai cible |
|---|---|---|---|
| **Sécurité (CVE)** | `vulnerabilityAlerts` Renovate | Équipe R + security-team | < 72 h (critique : < 24 h) |
| **Patch / mineure (sûre)** | Renovate (auto-merge helm/actions) | CI verte suffit | hebdomadaire |
| **Mineure (sensible)** | Renovate (PR) | Lead équipe R | sprint courant |
| **Majeure / breaking** | Renovate (label `breaking-change`) | **CAB** + lead R + security | planifiée (fenêtre) |
| **Kubernetes (cluster)** | manuel/Renovate | CAB + infra + security | trimestrielle |

## 4. Garde-fous techniques (déjà en place)

- **Renovate** (`.github/renovate.json`) : détection + PR + auto-merge mineur/patch sûrs, label
  `breaking-change` sur les majeures, label `security` + revue humaine sur les CVE.
- **CODEOWNERS** : la bonne équipe est sollicitée automatiquement en revue.
- **CI bloquante** : lint + kubeconform + trivy/checkov/tfsec/gitleaks/kubescape + conftest + SBOM/cosign.
- **Promotion par PR** `dev → staging → prod` (GitOps Flux) ; **rollback** par `git revert`.
- **Flux Image Automation** : PR automatique sur nouvelle image **signée** dans Harbor.

## 5. Revue du RACI

Revue **trimestrielle** par le Platform Lead avec les leads d'équipe ; mise à jour si la
composition des équipes ou la stack évolue.
