# Spec de Design - Plateforme d'Observabilité Reproductible (GitOps / DevSecOps)

> **Date** : 2026-06-19 · **Auteur** : William BATCHAYON · **Statut** : Validé (brainstorming)

---

## 1. Objectif

Construire une **plateforme d'observabilité 100% open source, reproductible dans n'importe quel
environnement**. Le principe directeur : *l'utilisateur change uniquement les credentials/valeurs
d'un environnement, puis lance - et obtient un déploiement identique et sécurisé.*

Source de vérité fonctionnelle : `idée.md`. Backend retenu : **stack Grafana
(Loki / Mimir / Tempo / Grafana)**. La spec OTel antérieure (`specification_packages_otel.md`)
qui mentionnait Elasticsearch/Thanos est **obsolète** et sera réalignée sur ce backend.

## 2. Principes d'architecture

1. **GitOps first** - Git est la source de vérité ; FluxCD réconcilie le cluster. Aucun
   `kubectl apply` manuel en exploitation.
2. **Pull Request workflow** - `main` = état prod, protégée. Toute évolution passe par PR avec
   CI bloquante, `CODEOWNERS`, conventional commits, promotion `dev → staging → prod` par PR.
3. **Sécurité par défaut (DevSecOps)** - mTLS partout (PKI Vault), secrets chiffrés (SOPS+age),
   NetworkPolicies deny-by-default, RBAC strict, policy-as-code (Kyverno/OPA), supply chain
   signée (SBOM + Cosign), scans intégrés à la CI.
4. **Air-gap pour les VMs** - les VMs ne communiquent jamais avec l'extérieur ; elles tirent les
   packages OTel depuis un dépôt interne (Harbor/Nexus) et sont gérées par **Ansible**.
5. **Variabilité isolée** - toute la configuration spécifique à un environnement (credentials,
   domaines, sizing, endpoints) vit dans `environments/<env>/`. Le code est identique partout.
6. **Reproductibilité** - Terraform (socle) + FluxCD/Helm (plateforme) + Ansible (VMs),
   versionnés, validés et signés.

## 3. Décisions tranchées

| Sujet | Décision | Raison |
|---|---|---|
| Backend télémétrie | Loki / Mimir / Tempo + Grafana | Aligné `idée.md`, 100% OSS, intégration native |
| Stockage long terme | MinIO (S3) | OSS, compatible S3 pour Loki/Mimir/Tempo |
| Provisioning cluster | **Obligatoire**, pluggable ; défaut **kubeadm on-prem** | Contexte air-gap multi-DC |
| Gestion secrets | SOPS+age dans Git + Vault runtime | Secrets chiffrés versionnables, un trousseau/env |
| PKI / mTLS | Vault PKI → cert-manager | Rotation auto, mTLS de bout en bout |
| GitOps | FluxCD | Réconciliation, image automation, drift detection |
| Dépôt packages OTel | Harbor/Nexus interne | VMs air-gap, pas d'accès Internet |
| Gestion VMs | Ansible | Fleet management OSS, idempotent |
| Policy-as-code | Kyverno (admission) + Conftest/OPA (CI) | Garde-fous cluster + CI |

## 4. Décomposition en briques (unités indépendantes)

Chaque brique a un périmètre clair, une interface (values d'environnement) et des dépendances
explicites. Ordre de construction respectant les dépendances :

| # | Brique | Dossier | Dépend de | Rôle |
|---|---|---|---|---|
| B0 | Socle repo / Makefile / CI / PR | racine, `.github/`, `ci/` | - | Orchestration, garde-fous, workflow Git |
| B1 | Provisioning cluster | `bootstrap/00-cluster` | - | K8s (kubeadm on-prem, pluggable) |
| B2 | Vault + PKI + auth | `bootstrap/10-vault` | B1 | Secrets, PKI mTLS, LDAP/AD |
| B3 | Bootstrap FluxCD | `bootstrap/20-flux` | B1 | GitOps engine |
| B4 | Dépôt packages | `bootstrap/30-package-repo` | B1 | Harbor/Nexus (packages OTel) |
| B5 | Sécurité plateforme | `platform/security` | B2,B3 | cert-manager, RBAC, NetworkPolicies, Kyverno |
| B6 | Stockage objet | `platform/storage` | B3,B5 | MinIO S3 |
| B7 | Backends télémétrie | `platform/backends` | B6 | Loki, Mimir, Tempo (**brique de référence complète**) |
| B8 | Ingestion | `platform/ingestion` | B7 | OTel Gateway x3 + Edge Collectors |
| B9 | Monitoring | `platform/monitoring` | B7 | Prometheus, Alertmanager, auto-healing |
| B10 | Visualisation | `platform/visualization` | B7 | Grafana (datasources + dashboards as-code) |
| B11 | Incident | `platform/incident` | B9 | OneUptime + GLPI + notifications |
| B12 | Ingress | `ingress` | B8 | HAProxy/LB + terminaison TLS |
| B13 | Fleet VMs | `ansible` | B4,B12 | Agents OTel air-gap via Ansible |
| B14 | Documentation | `docs` | toutes | Architecture, runbooks, how-it-works, imgs |

## 5. Flux de données (cible)

```
VMs (agent OTel, air-gap)
   └─ OTLP/gRPC mTLS ─▶ Edge Collector (par DC : buffer, filtre, compress)
        └─ OTLP/gRPC mTLS ─▶ HAProxy/LB (terminaison TLS, least-conn)
             └─ ─▶ OTel Gateway x3 (filter, batch, enrich, sampling, queues)
                  ├─ logs    ─▶ Loki  ─┐
                  ├─ metrics ─▶ Mimir ─┼─▶ MinIO (S3 long terme)
                  └─ traces  ─▶ Tempo ─┘
                                   └─▶ Grafana (visualisation unifiée) ─▶ OneUptime ─▶ GLPI + notifications
Prometheus ─▶ Alertmanager ─▶ OneUptime ─▶ GLPI + notifications
```

## 6. Workflow Git / Pull Requests

- **Branches** : `main` (prod, protégée), branches de feature, promotion par PR `dev→staging→prod`.
- **Branch protection** : PR requise, ≥1 review, status checks verts, pas de force-push, historique linéaire.
- **`CODEOWNERS`** : revue par responsables de dossier (sécu, plateforme, infra).
- **Templates** : `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`.
- **Conventional Commits** + titres de PR sémantiques validés en CI → changelog & versioning auto.
- **Automatisation** : Renovate (deps), Flux Image Automation (images signées), drift detection.

## 7. CI/CD (bonnes pratiques)

- **Validation** : `terraform fmt/validate`, `tflint`, `helm lint`, `kubeconform`, `yamllint`, `ansible-lint`.
- **Sécurité** : `trivy` (IaC/images/secrets), `checkov`, `tfsec`, `kubescape`, `gitleaks`.
- **Supply chain** : SBOM (syft) + signature Cosign.
- **Policy-as-code** : Conftest/OPA + Kyverno.
- **GitOps** : diff Flux + plan Terraform postés en commentaire de PR ; drift detection.
- **Release** : SemVer, changelog auto, environnements progressifs ; tout échec **bloque** le merge.

## 8. Sécurité (transversale)

| Niveau | Mécanisme |
|---|---|
| Transport | mTLS (TLS 1.3) agent→edge→LB→gateway→backends, via Vault PKI + cert-manager |
| Repos | Chiffrement au repos Loki/Mimir/Tempo/MinIO |
| Secrets | SOPS+age (Git) + Vault runtime, un trousseau par env |
| Réseau | NetworkPolicies deny-by-default, segmentation namespaces |
| AuthZ | RBAC strict, Grafana OAuth2/SAML, Vault via LDAP/AD |
| Admission | Kyverno (images signées, non-root, ressources requises) |
| Supply chain | Registre interne, scan Trivy, signature Cosign, SBOM |

## 9. Structure du repo

```
observability-platform/
├── Makefile                 # bootstrap / deploy / validate / scan / clean
├── README.md                # Quickstart "change credentials & launch"
├── .github/                 # workflows CI/CD, CODEOWNERS, templates PR/issue, renovate.json
├── environments/            # _template + dev/staging/prod (values + secrets SOPS)
├── bootstrap/               # Terraform : 00-cluster, 10-vault, 20-flux, 30-package-repo
├── platform/                # Flux HelmReleases : security, storage, backends, ingestion,
│                            #   monitoring, visualization, incident
├── ingress/                 # HAProxy/LB + TLS
├── ansible/                 # inventories / roles / playbooks (agents OTel air-gap)
├── ci/                      # scripts partagés de validation/scan
└── docs/                    # imgs/, architecture/, runbooks/, how-it-works/
```

## 10. Critères de succès

1. `make validate` passe (lint + kubeconform + scans) sur l'ensemble du repo.
2. Un nouvel environnement se crée en copiant `environments/_template/` et en remplissant
   **uniquement** les credentials/valeurs - aucun autre fichier à toucher.
3. `make bootstrap && make deploy` documenté de bout en bout (cluster → Vault → Flux → plateforme).
4. Chaîne mTLS documentée et cohérente de l'agent jusqu'aux backends.
5. CI/CD avec tous les gates de sécurité et workflow PR opérationnels.
6. Documentation complète (`docs/`) avec schémas (`docs/imgs/`) expliquant le fonctionnement.

## 11. Hors périmètre (YAGNI)

- Provisioning de cloud public spécifique (modules fournis mais non testés sur un compte réel).
- Génération de GIFs animés (les `docs/imgs/` contiennent diagrammes Mermaid/SVG + emplacements documentés).
- Données réelles / tenants de production.
