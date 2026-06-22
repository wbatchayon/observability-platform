# Changelog

## [0.1.4](https://github.com/wbatchayon/observability-platform/compare/v0.1.3...v0.1.4) (2026-06-22)


### 🚀 Fonctionnalités

* alerting Grafana vers Alertmanager central + correction du schéma d'architecture et du README ([#38](https://github.com/wbatchayon/observability-platform/issues/38)) ([9fbebc0](https://github.com/wbatchayon/observability-platform/commit/9fbebc0d2779809a978427e9966a23183d3095cd))


### 🐛 Corrections

* Renovate utilise le GITHUB_TOKEN par défaut (repli si RENOVATE_TOKEN absent) ([#36](https://github.com/wbatchayon/observability-platform/issues/36)) ([a16b45a](https://github.com/wbatchayon/observability-platform/commit/a16b45afc8e3041bdff2aa92d7952dade3da2fbc))

## [0.1.3](https://github.com/wbatchayon/observability-platform/compare/v0.1.2...v0.1.3) (2026-06-22)


### 🚀 Fonctionnalités

* déploiement universel multi-cloud et console de management complète ([#34](https://github.com/wbatchayon/observability-platform/issues/34)) ([63a7712](https://github.com/wbatchayon/observability-platform/commit/63a771238f8e9547a7b808b58e86a89c10405aed))
* **gui:** design responsive (mobile/tablette) ([47b12ea](https://github.com/wbatchayon/observability-platform/commit/47b12ea0289e89b49dd69b34750e6217fbcd6829))
* **gui:** internationalisation FR/EN ([b460bd1](https://github.com/wbatchayon/observability-platform/commit/b460bd1e9536302a263a34c1f9910d11e60cbe32))
* **gui:** internationalisation FR/EN (sélecteur de langue, détection navigateur, persistance) ([376d9fc](https://github.com/wbatchayon/observability-platform/commit/376d9fc02ae1a4ddf528b214aef32a976e104ae0))
* **gui:** responsive (menu hamburger mobile, tableau scrollable, mises en page adaptatives) ([6fb5fa7](https://github.com/wbatchayon/observability-platform/commit/6fb5fa79fbca18026b275798869f4fc65377191d))


### 🐛 Corrections

* déployabilité multi-cluster, ordonnancement Flux, doc ressources et fichiers open-source ([#29](https://github.com/wbatchayon/observability-platform/issues/29)) ([99cdc76](https://github.com/wbatchayon/observability-platform/commit/99cdc76bf4a5e4c01f94b13d7b15cdf91aa4728c))
* **security:** NetworkPolicies deny-by-default pour incident + Kyverno verify-images en Audit (images non signées) ([44f6b98](https://github.com/wbatchayon/observability-platform/commit/44f6b98be1fdc0bdc36b2bdcd1480e607cf68e69))
* **security:** remédiations de la revue de sécurité ([877b243](https://github.com/wbatchayon/observability-platform/commit/877b243533890192741ea66147edf2161342e32d))


### 📚 Documentation

* présentation (PPT) et documentation (DOC) du projet ([0d1dbb3](https://github.com/wbatchayon/observability-platform/commit/0d1dbb390ab5878f06d1069c0051339bc449be0e))
* présentation PowerPoint et document Word du projet (+ schémas et captures) ([f78b2b8](https://github.com/wbatchayon/observability-platform/commit/f78b2b8eca445db7333f6b6020fee96d8aed810a))


### 🔧 CI/CD

* relecteur fictif (auto-approbation des PR de [@wbatchayon](https://github.com/wbatchayon)) ([#27](https://github.com/wbatchayon/observability-platform/issues/27)) ([cc0ca89](https://github.com/wbatchayon/observability-platform/commit/cc0ca896fd11e55864d6b99d7512d13d95167fc5))

## [0.1.2](https://github.com/wbatchayon/observability-platform/compare/v0.1.1...v0.1.2) (2026-06-20)


### 🐛 Corrections

* **ci:** artefacts de release résilients ([0cbfa56](https://github.com/wbatchayon/observability-platform/commit/0cbfa560552fd7944b33eff078f87272d0c57375))
* **ci:** job d'artefacts de release résilient (signature best-effort, publication des artefacts présents) ([805d0aa](https://github.com/wbatchayon/observability-platform/commit/805d0aa2ebbc2d78d4af001e63b47f9f057169b2))

## [0.1.1](https://github.com/wbatchayon/observability-platform/compare/v0.1.0...v0.1.1) (2026-06-20)


### 🚀 Fonctionnalités

* bootstrap Terraform (cluster, Vault PKI, FluxCD, dépôt packages) ([5a10dc1](https://github.com/wbatchayon/observability-platform/commit/5a10dc140dd59f51fc88e5a81348f94e785e29da))
* **ci:** gestion des releases (release-please + artefacts signés bundle/SBOM/cosign) ([7f50262](https://github.com/wbatchayon/observability-platform/commit/7f5026295672aeed146dc603e88df8b3e6ca59bb))
* **ci:** pipeline d'automatisation des montées de version (runner Renovate self-hosted + auto-merge) ([0329178](https://github.com/wbatchayon/observability-platform/commit/0329178d024ac7babb13e115762ea6a6dfac377c))
* durcissement air-gap (Vault auto-unseal Transit, dépôts signés, rotation token Harbor, tout via Harbor) ([39e2590](https://github.com/wbatchayon/observability-platform/commit/39e2590de43ee56b349a8e218e3c33670fe90055))
* environnements (_template + dev/staging/prod) - surface de configuration unique ([a1ac999](https://github.com/wbatchayon/observability-platform/commit/a1ac999825282a90fde5443fc4105b06843e64e6))
* failover OneUptime↔Alertmanager, Slack via OneUptime, catalogue GUI complété (Slack + Renovate patch management) ([5f73905](https://github.com/wbatchayon/observability-platform/commit/5f739055bcaac98bb2f5423e943b7b821c9271df))
* gestion des agents OTel sur VMs air-gap via Ansible ([e1ebb71](https://github.com/wbatchayon/observability-platform/commit/e1ebb7153d8109283fd421a66197aaf229717715))
* **gui:** authentification multi-fournisseurs (Google/Gmail, SSO OIDC, GitHub OAuth, jeton) + jeton de service GitHub pour les actions ([b5f0b6c](https://github.com/wbatchayon/observability-platform/commit/b5f0b6c249bf49504255fe12679cf53746d1e476))
* **gui:** connexion OAuth GitHub (sans jeton) + lien de génération de jeton ([89ab734](https://github.com/wbatchayon/observability-platform/commit/89ab73421b37c95d750b057bb42bb6cb9c83f889))
* **gui:** console de management (Next.js) - config, credentials, pipelines, suivi ([309891d](https://github.com/wbatchayon/observability-platform/commit/309891d0b0ecd7613ac5a15f0bb47e518be75b20))
* **gui:** contrôle d'accès applicatif (accès en écriture au dépôt requis, allowlist/org optionnels) ([5cb3114](https://github.com/wbatchayon/observability-platform/commit/5cb31148af078cda3ba8d0564f367d1f7adf841b))
* **gui:** déploiement Vercel pour dev (output standalone conditionnel) ([d51fa60](https://github.com/wbatchayon/observability-platform/commit/d51fa602794bfde346caeb3e36d5e58620ead272))
* **gui:** refonte visuelle (maquette vue.png) + page Outils (accès direct aux composants déployés) ([80e7bcf](https://github.com/wbatchayon/observability-platform/commit/80e7bcf3cb358a3fc3953cd36d9f49ddac332551))
* plateforme - gestion d'incidents (OneUptime/GLPI) et ingress HAProxy ([3f6cae0](https://github.com/wbatchayon/observability-platform/commit/3f6cae0c3307c4a5331be2407048d6664e6c5319))
* plateforme - ingestion OTel, monitoring Prometheus/Alertmanager, visualisation Grafana ([6652a6a](https://github.com/wbatchayon/observability-platform/commit/6652a6acf0af53ae05b2cd7a9d1130a7c74bd6d8))
* plateforme - sécurité (mTLS/RBAC/policies), stockage MinIO, backends Loki/Mimir/Tempo ([1c570e2](https://github.com/wbatchayon/observability-platform/commit/1c570e2c18472b9c57378d2ba689253f639be591))
* plateforme d'observabilité reproductible (GitOps/DevSecOps) ([0b9ce0f](https://github.com/wbatchayon/observability-platform/commit/0b9ce0f7800db796d351e86373af4c1f38be1710))
* socle repo (Makefile, CI/CD, workflow PR, scripts de validation) ([606745a](https://github.com/wbatchayon/observability-platform/commit/606745a2745f381004b75c660acafe17b3fb0eb4))


### 🐛 Corrections

* **ci:** annotations propres (cosign exit 0, release-please v5) ([338d1e2](https://github.com/wbatchayon/observability-platform/commit/338d1e2fe0915de8abcd6043d118db71d7729013))
* **ci:** corrige la validation kubeconform du ScaledObject et gradue les scanners (advisory au 1er import) ([aaae80a](https://github.com/wbatchayon/observability-platform/commit/aaae80a3cd778c09ce6133f85e20602a6b8141de))
* **ci:** corrige les findings tflint (required_providers module, déclarations inutilisées) ([6163354](https://github.com/wbatchayon/observability-platform/commit/6163354b18209d74a50117bb8cedfd1f61b547f0))
* **ci:** durcit GLPI/MariaDB, scanners en mode rapport sans annotations, pipeline étagée (needs) ([c201109](https://github.com/wbatchayon/observability-platform/commit/c20110929b6a93af9ef675c7f4ced8e46d86e426))
* **ci:** mock_modules ansible-lint pour les modules Windows + requirements.yml contrôleur ([a8a9c85](https://github.com/wbatchayon/observability-platform/commit/a8a9c8527cf243c6ff8540e6f083574f4b7617cd))
* **ci:** pin cosign-installer sur v4.1.2 (pas de tag flottant v4) ([fa89563](https://github.com/wbatchayon/observability-platform/commit/fa89563a7d31b970f8350cabee9f225f68363489))
* **ci:** rend la CI verte sur main (SBOM signature best-effort) ([e259699](https://github.com/wbatchayon/observability-platform/commit/e25969961e3f1b895b2da6d1aad7d2152cc0b934))
* **ci:** signature cosign exit 0 (annotations propres) et release-please v5 (Node 24) ([d67e197](https://github.com/wbatchayon/observability-platform/commit/d67e197f0bd7b0105840a64759743aa416f95647))
* **ci:** signature SBOM en best-effort (continue-on-error) et upload systématique ([1d3c068](https://github.com/wbatchayon/observability-platform/commit/1d3c068bda1064a13d39bd4256adf7091ceee1b7))
* complète les NetworkPolicies egress et ajoute la revue de sécurité ([e258362](https://github.com/wbatchayon/observability-platform/commit/e258362040c5e7f88ca3bc33f5ce2a7b40d3f665))
* corrige le schéma de rétention Harbor et le formatage Terraform ([4a65f1d](https://github.com/wbatchayon/observability-platform/commit/4a65f1d463ed97f7b245b8a55d02781537ebee51))
* **gui:** /api/tools en rendu dynamique (lit TOOL_* à l'exécution) ([876bee6](https://github.com/wbatchayon/observability-platform/commit/876bee6b72fef530c24163f049a6e6308dd88502))
* **gui:** bouton OAuth cliquable avec message clair si non configuré ([8d1d151](https://github.com/wbatchayon/observability-platform/commit/8d1d151ec452003e14d9aaf2b9cc29d18d12b6a5))
* **gui:** durcissement avant prod (en-têtes de sécurité, /api/tools authentifié, polling Suivi conditionné à l'auth) ([2537a34](https://github.com/wbatchayon/observability-platform/commit/2537a34dcbc84bfa083cdda300effbdea4ae1f79))
* **gui:** durcissement code-review (env-secrets bout-en-bout, env secrets scoped, erreurs non divulguées, branche stable, ref configurable, erreurs de config) ([e906897](https://github.com/wbatchayon/observability-platform/commit/e906897858bed9464661ec1b6d32955881c089c1))
* **gui:** masque la connexion OAuth tant qu'elle n'est pas configurée (jeton en méthode primaire, sans avertissement) ([2224ee9](https://github.com/wbatchayon/observability-platform/commit/2224ee93a8e205c9eab199aab36d394e5ec777a8))
* lien rôles Ansible et formatage des tfvars ([f22d0e2](https://github.com/wbatchayon/observability-platform/commit/f22d0e23e94f2815e1f78da5fd00491c23367093))
* **review:** câblage GitOps clusters/&lt;env&gt;, NetworkPolicies ingress, PVC files OTel, sélecteur Alertmanager, projets Harbor charts/library, robustesse buckets ([c74763d](https://github.com/wbatchayon/observability-platform/commit/c74763d929437d8cb42f683c878f0e42c9f2d147))
* **review:** durcissement strict du miroir containerd air-gap (idempotent, sandbox image, vérification bloquante) ([717553a](https://github.com/wbatchayon/observability-platform/commit/717553a01a42efb679154f9906c342b588718dcb))


### 📚 Documentation

* architecture, ADR, runbooks, how-it-works et schémas ([9e7f218](https://github.com/wbatchayon/observability-platform/commit/9e7f218681d70b7974f83da4859f61595cf56acc))
* corrections de mise en forme (normalisation typographique) ([9c3867a](https://github.com/wbatchayon/observability-platform/commit/9c3867a177fcc16a6674747210e46e5c14529989))
* plan d'implémentation des briques ([6dc5b23](https://github.com/wbatchayon/observability-platform/commit/6dc5b2379787a76572a68f7320b901c9df414d62))
* RACI de gestion des montées de version des outils ([1072b4f](https://github.com/wbatchayon/observability-platform/commit/1072b4f885f6688a2f902f705d96d4cb3f4e08e3))
* rendus PNG des schémas + GIF animé du flux de données ([7657711](https://github.com/wbatchayon/observability-platform/commit/7657711afe1394ac73b3dbd87860be920c9eca98))
* spec de design de la plateforme d'observabilité ([d482816](https://github.com/wbatchayon/observability-platform/commit/d482816ba39927a3814dd29ed99c28a2192a4d64))


### 🔧 CI/CD

* bump des actions vers Node 24 (supprime les warnings de dépréciation) ([21a4f26](https://github.com/wbatchayon/observability-platform/commit/21a4f26c428306359253b047f4e0f1d77177e7c2))
* bump setup-tflint et upload-artifact en Node 24 (annotations propres) ([2679235](https://github.com/wbatchayon/observability-platform/commit/267923571511c576bebca7d0d1e7d52a8d3cd450))
* déclenche la CI sur toutes les PR (support des PR empilées) ([91ce18e](https://github.com/wbatchayon/observability-platform/commit/91ce18e851c4309e8a13e7a8096b551c1064baeb))
* **gui:** bump setup-node en Node 24 (annotation propre) ([4e37374](https://github.com/wbatchayon/observability-platform/commit/4e373740418ca6f75e04c31f364a882f798f0e71))
* re-déclenche la CI ([6390cfb](https://github.com/wbatchayon/observability-platform/commit/6390cfbd4275ce67a6bc9969d22691e143671605))
