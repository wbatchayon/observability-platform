# Plateforme d'Observabilité — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un monorepo GitOps/DevSecOps déployant une plateforme d'observabilité (Loki/Mimir/Tempo/Grafana) reproductible — l'utilisateur change les credentials d'un environnement et lance.

**Architecture:** Terraform (socle : cluster, Vault, Flux, dépôt packages) → FluxCD/Helm (plateforme K8s) → Ansible (agents OTel sur VMs air-gap). Toute la variabilité est isolée dans `environments/<env>/`. Sécurité transversale : mTLS Vault PKI, SOPS, NetworkPolicies, Kyverno, supply chain signée.

**Tech Stack:** Terraform, kubeadm, HashiCorp Vault, FluxCD, Helm, Loki, Mimir, Tempo, Grafana, OpenTelemetry Collector, Prometheus, Alertmanager, MinIO, HAProxy, Ansible, Harbor/Nexus, SOPS+age, cert-manager, Kyverno, Trivy, Cosign, GitHub Actions.

## Global Constraints

- 100% open source — aucune dépendance propriétaire.
- Backend = Loki/Mimir/Tempo/Grafana (la spec OTel Elasticsearch/Thanos est obsolète).
- VMs air-gap : packages OTel tirés depuis Harbor/Nexus interne, gérées par Ansible uniquement.
- mTLS de bout en bout (agent→edge→LB→gateway→backends) via Vault PKI + cert-manager.
- Secrets jamais en clair dans Git : SOPS+age, un trousseau par env.
- Toute variabilité d'environnement vit dans `environments/<env>/` ; le reste du code est identique.
- GitOps : pas de `kubectl apply` manuel en exploitation ; Flux réconcilie.
- Workflow PR : `main` protégée, CI bloquante, conventional commits, promotion par PR.
- OTel Collector contrib v0.148.0 (déjà spécifié dans VM_Configuration).
- Validation IaC : `terraform validate`, `helm lint`, `kubeconform`, `yamllint`, `ansible-lint`, `trivy`.

---

## Adaptation TDD pour l'IaC

L'IaC n'a pas de tests unitaires classiques. Le cycle de chaque brique est :
1. Écrire la configuration (Terraform/Helm/Ansible/YAML).
2. **Valider** (le « test ») : `validate`/`lint`/`kubeconform`/`conftest`/`trivy`.
3. Corriger jusqu'au vert.
4. Commit (conventional commit).

---

## Task B0 : Socle repo — Makefile, CI/CD, workflow PR

**Files:**
- Create: `Makefile`, `README.md`
- Create: `.github/workflows/ci.yaml`, `.github/workflows/release.yaml`
- Create: `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/bug.md`, `.github/ISSUE_TEMPLATE/feature.md`
- Create: `.github/renovate.json`
- Create: `ci/validate.sh`, `ci/scan.sh`, `ci/lint.sh`
- Create: `.sops.yaml`, `.yamllint.yaml`, `.tflint.hcl`
- Create: `docs/how-it-works/git-workflow.md`

**Interfaces:**
- Produces: cibles `make bootstrap|deploy|validate|scan|lint|clean|encrypt|decrypt` ; scripts CI réutilisables par toutes les briques.

**Contenu attendu:**
- `Makefile` : cibles orchestrant Terraform/Flux/Ansible + validation/scan, paramétré par `ENV?=dev`.
- CI `ci.yaml` : jobs `lint` (yamllint, tflint, ansible-lint, helm lint, kubeconform), `security` (trivy, checkov, tfsec, gitleaks, kubescape), `policy` (conftest/OPA), `supply-chain` (syft SBOM + cosign), `plan` (terraform plan + flux diff postés en commentaire PR). Tous bloquants.
- `release.yaml` : SemVer + changelog (conventional commits).
- `CODEOWNERS` mappant dossiers → équipes.
- `renovate.json` : updates auto par PR.
- `.sops.yaml` : règles de chiffrement (`environments/*/secrets*.yaml` → age).

**Validation:** `yamllint .github/`, `actionlint .github/workflows/*.yaml`, `make -n validate`.

---

## Task B1 : Provisioning cluster (`bootstrap/00-cluster`)

**Files:** `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `modules/kubeadm/`, `README.md`

**Interfaces:**
- Consumes: `environments/<env>/cluster.tfvars` (noms de nœuds, IPs, CIDR pods/services, version K8s).
- Produces: `kubeconfig` (output), endpoint API, nom du cluster — consommés par B2/B3.

**Contenu:** module `kubeadm` pluggable (défaut on-prem : init control-plane, join workers, CNI Calico, CIDR configurable). Providers pluggables documentés pour cloud. Variables sans valeur en dur — tout vient des tfvars d'env.

**Validation:** `terraform init -backend=false && terraform validate && tflint`.

---

## Task B2 : Vault + PKI mTLS + auth (`bootstrap/10-vault`)

**Files:** `main.tf`, `variables.tf`, `outputs.tf`, `pki.tf`, `policies/`, `auth.tf`, `README.md`

**Interfaces:**
- Consumes: `kubeconfig` (B1), `environments/<env>/vault.tfvars`.
- Produces: endpoint Vault, rôle PKI (`pki_issuer_url`), montages secrets — consommés par B5 (cert-manager) et toutes les briques nécessitant des secrets.

**Contenu:** déploiement Vault (HA Raft), activation PKI (CA racine + intermédiaire pour mTLS), policies par brique, auth Kubernetes + LDAP/AD. Rotation de certs configurée.

**Validation:** `terraform validate && tflint && checkov -d .`.

---

## Task B3 : Bootstrap FluxCD (`bootstrap/20-flux`)

**Files:** `main.tf`, `variables.tf`, `flux-system/`, `kustomizations.yaml`, `README.md`

**Interfaces:**
- Consumes: `kubeconfig` (B1), URL du repo Git, `environments/<env>/flux.tfvars`.
- Produces: `GitRepository` + `Kustomization` pointant `platform/` et `environments/<env>/` ; reconcile path par env.

**Contenu:** bootstrap Flux (controllers source/kustomize/helm/image-automation/notification), Kustomization racine par environnement, image automation (PR sur nouvelle image signée), notification provider (alertes drift).

**Validation:** `terraform validate`, `kubeconform` sur les manifests Flux générés, `flux check --pre` (documenté).

---

## Task B4 : Dépôt packages OTel (`bootstrap/30-package-repo`)

**Files:** `main.tf`, `variables.tf`, `harbor.tf` (ou `nexus.tf`), `repositories.tf`, `README.md`

**Interfaces:**
- Consumes: `kubeconfig`/infra (B1), `environments/<env>/registry.tfvars`.
- Produces: URL du dépôt interne + chemins des packages OTel (`.deb/.rpm/.tar.gz` v0.148.0) — consommés par B13 (Ansible).

**Contenu:** déploiement Harbor (registre OCI + dépôt de packages génériques) ou Nexus, repositories pour packages OTel, comptes robot read-only pour les VMs, rétention. Alignement sur `VM_Configuration/Docs/Markdown/specification_packages_otel.md` (liste des packages).

**Validation:** `terraform validate && tflint`.

---

## Task B5 : Sécurité plateforme (`platform/security`)

**Files:** `kustomization.yaml`, `cert-manager.yaml` (HelmRelease), `cluster-issuer-vault.yaml`, `rbac/`, `network-policies/`, `kyverno.yaml` (HelmRelease), `kyverno-policies/`, `README.md`

**Interfaces:**
- Consumes: `pki_issuer_url` (B2), `environments/<env>/security.values.yaml`.
- Produces: `ClusterIssuer` Vault (utilisé par tous pour les certs mTLS), NetworkPolicies deny-by-default par namespace, RBAC, policies Kyverno.

**Contenu:** cert-manager + ClusterIssuer Vault PKI ; NetworkPolicies deny-all + allow ciblés ; RBAC par composant ; Kyverno (exiger images signées, non-root, requests/limits, interdiction `:latest`).

**Validation:** `helm lint`, `kubeconform`, `conftest test` (policies), `kubescape scan`.

---

## Task B6 : Stockage objet MinIO (`platform/storage`)

**Files:** `kustomization.yaml`, `minio.yaml` (HelmRelease), `buckets.yaml`, `README.md`

**Interfaces:**
- Consumes: `ClusterIssuer` (B5), `environments/<env>/storage.values.yaml` (sizing, credentials via SOPS).
- Produces: endpoint S3 + buckets (`loki`, `mimir`, `tempo`) + secret d'accès — consommés par B7.

**Contenu:** MinIO distribué (≥4 nœuds), TLS via cert-manager, versioning + chiffrement au repos, buckets pré-créés, politique de rétention.

**Validation:** `helm lint`, `kubeconform`, `trivy config`.

---

## Task B7 : Backends télémétrie (`platform/backends`) — BRIQUE DE RÉFÉRENCE

**Files:** `kustomization.yaml`, `loki.yaml`, `mimir.yaml`, `tempo.yaml` (HelmReleases), `README.md`

**Interfaces:**
- Consumes: endpoint S3 + buckets (B6), `ClusterIssuer` (B5), `environments/<env>/backends.values.yaml` (rétention, réplication, tenants).
- Produces: endpoints OTLP/push internes (`loki-gateway`, `mimir-distributor`, `tempo-distributor`) — consommés par B8 ; datasources — consommés par B10.

**Contenu:** Loki (mode distribué, S3, rétention), Mimir (multi-tenant, S3, réplication), Tempo (distribué, S3, OTLP receiver). mTLS interne, multi-tenancy. **Brique modèle** : doc et structure exemplaires que les autres suivent.

**Validation:** `helm lint`, `kubeconform`, `conftest test`, `trivy config`.

---

## Task B8 : Ingestion — OTel Gateway + Edge (`platform/ingestion`)

**Files:** `kustomization.yaml`, `otel-gateway.yaml` (HelmRelease, 3 replicas), `edge-collector.yaml`, `gateway-config.yaml`, `README.md`

**Interfaces:**
- Consumes: endpoints backends (B7), `ClusterIssuer` (B5), `environments/<env>/ingestion.values.yaml`.
- Produces: endpoint d'ingestion OTLP (service exposé via B12) consommé par les agents VMs (B13).

**Contenu:** OTel Gateway (3 replicas) — pipeline : receivers OTLP mTLS → processors (memory_limiter, filter, batch, resource/attributes enrichment, tail sampling) → queues (memory + persistent + retry) → exporters Loki/Mimir/Tempo. Edge Collector (DaemonSet/Deployment par DC) : buffer, filtre, compression. Aligné OTel v0.148.0.

**Validation:** `helm lint`, `kubeconform`, validation config OTel (`otelcol validate`), `trivy config`.

---

## Task B9 : Monitoring (`platform/monitoring`)

**Files:** `kustomization.yaml`, `prometheus.yaml` (HelmRelease, kube-prometheus-stack), `alertmanager.yaml`, `alert-rules/`, `auto-healing.yaml`, `README.md`

**Interfaces:**
- Consumes: cibles à scraper (B7, B8), `environments/<env>/monitoring.values.yaml`.
- Produces: alertes routées vers OneUptime (B11) ; signal Alertmanager.

**Contenu:** Prometheus (scrape gateways/backends/cluster, 2 replicas), règles PromQL, Alertmanager (groupement/inhibition/escalade), auto-healing (Kyverno cleanup / restart policies / KEDA si pertinent).

**Validation:** `helm lint`, `kubeconform`, `promtool check rules`, `trivy config`.

---

## Task B10 : Visualisation Grafana (`platform/visualization`)

**Files:** `kustomization.yaml`, `grafana.yaml` (HelmRelease), `datasources/`, `dashboards/`, `README.md`

**Interfaces:**
- Consumes: datasources Loki/Mimir/Tempo (B7), Prometheus (B9), `environments/<env>/grafana.values.yaml` (OAuth/SAML, admin via SOPS).
- Produces: UI Grafana exposée via B12.

**Contenu:** Grafana (2 replicas, session stickiness), datasources as-code (corrélation logs/traces/metrics), dashboards as-code (par composant), auth OAuth2/SAML + RBAC, alerting visuel → Alertmanager.

**Validation:** `helm lint`, `kubeconform`, validation JSON dashboards, `trivy config`.

---

## Task B11 : Incident (`platform/incident`)

**Files:** `kustomization.yaml`, `oneuptime.yaml` (HelmRelease), `glpi.yaml`, `notifications.yaml`, `README.md`

**Interfaces:**
- Consumes: signal Alertmanager (B9), `environments/<env>/incident.values.yaml`.
- Produces: tickets GLPI + notifications (email/Slack/Teams).

**Contenu:** OneUptime (monitoring uptime/SSL/endpoints, réception webhook Alertmanager), GLPI (création auto de tickets depuis OneUptime), canaux de notification configurables par sévérité/équipe.

**Validation:** `helm lint`, `kubeconform`, `trivy config`.

---

## Task B12 : Ingress (`ingress`)

**Files:** `kustomization.yaml`, `haproxy.yaml` (HelmRelease), `tls/`, `routes/`, `README.md`

**Interfaces:**
- Consumes: services gateway (B8), Grafana (B10), `ClusterIssuer` (B5), `environments/<env>/ingress.values.yaml` (domaines, VIP).
- Produces: points d'entrée TLS (OTLP/gRPC pour edge, HTTPS pour Grafana).

**Contenu:** HAProxy (2 instances active/active), terminaison TLS (certs cert-manager), least-connections, health checks, timeouts gRPC 30s, retry backoff. Routes OTLP/gRPC + HTTPS Grafana.

**Validation:** `helm lint`, `kubeconform`, `haproxy -c -f` (check config), `trivy config`.

---

## Task B13 : Fleet VMs — Ansible (`ansible`)

**Files:** `ansible.cfg`, `inventories/_template/hosts.yaml`, `inventories/dev|staging|prod/`, `roles/otel-agent/`, `roles/common/`, `playbooks/install-agent.yaml`, `playbooks/configure-agent.yaml`, `README.md`

**Interfaces:**
- Consumes: URL dépôt packages (B4), endpoint d'ingestion edge/LB (B12), `inventories/<env>/group_vars/` (credentials via vault Ansible/SOPS).
- Produces: agents OTel installés et configurés sur les VMs, exportant en OTLP/gRPC mTLS vers les Edge Collectors.

**Contenu:** rôle `otel-agent` idempotent : installe le package depuis Nexus/Harbor (offline, pas d'Internet), templating config OTLP (receivers hostmetrics/filelog/journald/windowseventlog → exporter OTLP mTLS vers edge), service systemd (Linux) / `sc.exe` (Windows). Réutilise/industrialise `VM_Configuration/Manuelle/`. Détection OS (Debian/RHEL/Windows).

**Validation:** `ansible-lint`, `ansible-playbook --syntax-check`, `yamllint`.

---

## Task B14 : Documentation (`docs`)

**Files:** `docs/architecture/README.md`, `docs/architecture/data-flow.md`, `docs/architecture/adr/`, `docs/runbooks/{deploy,incident,scaling,dr}.md`, `docs/how-it-works/README.md`, `docs/how-it-works/git-workflow.md`, `docs/imgs/*.mmd` (+ SVG rendus), `README.md` racine

**Interfaces:**
- Consumes: toutes les briques.
- Produces: documentation complète et schémas.

**Contenu:** explication de bout en bout du projet, flux de données, ADRs des décisions, runbooks d'exploitation, guide « change credentials & launch », diagrammes Mermaid (architecture, flux, sécurité, workflow PR) dans `docs/imgs/` + rendus SVG. Emplacements de screenshots/GIFs documentés.

**Validation:** `yamllint`, `markdownlint` (si dispo), rendu Mermaid sans erreur.

---

## Task ENV : Environnements (`environments/`)

**Files:** `_template/` (tous les `*.tfvars` et `*.values.yaml` + `secrets.sops.yaml` avec clés vides documentées), `dev/`, `staging/`, `prod/`

**Interfaces:**
- Produces: l'unique surface de configuration — copier `_template/`, remplir, lancer.

**Contenu:** un fichier par brique avec toutes les variables (commentées), secrets chiffrés SOPS. `dev/staging/prod` = exemples remplis avec valeurs non sensibles.

**Validation:** `sops --decrypt` (round-trip), cohérence des clés entre `_template` et chaque env.

---

## Self-Review

- **Couverture spec** : B0→B14 + ENV couvrent toutes les sections de la spec (GitOps, PR, sécurité, CI/CD, briques, docs, reproductibilité). ✔
- **Placeholders** : chaque tâche a fichiers + interfaces + contenu + validation concrets. ✔
- **Cohérence interfaces** : outputs B1(kubeconfig)→B2/B3 ; B2(pki)→B5 ; B6(S3)→B7 ; B7(endpoints)→B8/B10 ; B4(packages)+B12(ingress)→B13. ✔
- **Reproductibilité** : toute variabilité dans `environments/`, validée par Task ENV. ✔
