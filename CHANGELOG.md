# Changelog

## 1.0.0 (2026-06-20)


### Features

* bootstrap Terraform (cluster, Vault PKI, FluxCD, dépôt packages) ([5a10dc1](https://github.com/wbatchayon/observability-platform/commit/5a10dc140dd59f51fc88e5a81348f94e785e29da))
* durcissement air-gap (Vault auto-unseal Transit, dépôts signés, rotation token Harbor, tout via Harbor) ([39e2590](https://github.com/wbatchayon/observability-platform/commit/39e2590de43ee56b349a8e218e3c33670fe90055))
* environnements (_template + dev/staging/prod) - surface de configuration unique ([a1ac999](https://github.com/wbatchayon/observability-platform/commit/a1ac999825282a90fde5443fc4105b06843e64e6))
* gestion des agents OTel sur VMs air-gap via Ansible ([e1ebb71](https://github.com/wbatchayon/observability-platform/commit/e1ebb7153d8109283fd421a66197aaf229717715))
* plateforme - gestion d'incidents (OneUptime/GLPI) et ingress HAProxy ([3f6cae0](https://github.com/wbatchayon/observability-platform/commit/3f6cae0c3307c4a5331be2407048d6664e6c5319))
* plateforme - ingestion OTel, monitoring Prometheus/Alertmanager, visualisation Grafana ([6652a6a](https://github.com/wbatchayon/observability-platform/commit/6652a6acf0af53ae05b2cd7a9d1130a7c74bd6d8))
* plateforme - sécurité (mTLS/RBAC/policies), stockage MinIO, backends Loki/Mimir/Tempo ([1c570e2](https://github.com/wbatchayon/observability-platform/commit/1c570e2c18472b9c57378d2ba689253f639be591))
* plateforme d'observabilité reproductible (GitOps/DevSecOps) ([0b9ce0f](https://github.com/wbatchayon/observability-platform/commit/0b9ce0f7800db796d351e86373af4c1f38be1710))
* socle repo (Makefile, CI/CD, workflow PR, scripts de validation) ([606745a](https://github.com/wbatchayon/observability-platform/commit/606745a2745f381004b75c660acafe17b3fb0eb4))


### Bug Fixes

* **ci:** corrige la validation kubeconform du ScaledObject et gradue les scanners (advisory au 1er import) ([aaae80a](https://github.com/wbatchayon/observability-platform/commit/aaae80a3cd778c09ce6133f85e20602a6b8141de))
* **ci:** corrige les findings tflint (required_providers module, déclarations inutilisées) ([6163354](https://github.com/wbatchayon/observability-platform/commit/6163354b18209d74a50117bb8cedfd1f61b547f0))
* **ci:** durcit GLPI/MariaDB, scanners en mode rapport sans annotations, pipeline étagée (needs) ([c201109](https://github.com/wbatchayon/observability-platform/commit/c20110929b6a93af9ef675c7f4ced8e46d86e426))
* **ci:** mock_modules ansible-lint pour les modules Windows + requirements.yml contrôleur ([a8a9c85](https://github.com/wbatchayon/observability-platform/commit/a8a9c8527cf243c6ff8540e6f083574f4b7617cd))
* **ci:** pin cosign-installer sur v4.1.2 (pas de tag flottant v4) ([fa89563](https://github.com/wbatchayon/observability-platform/commit/fa89563a7d31b970f8350cabee9f225f68363489))
* complète les NetworkPolicies egress et ajoute la revue de sécurité ([e258362](https://github.com/wbatchayon/observability-platform/commit/e258362040c5e7f88ca3bc33f5ce2a7b40d3f665))
* corrige le schéma de rétention Harbor et le formatage Terraform ([4a65f1d](https://github.com/wbatchayon/observability-platform/commit/4a65f1d463ed97f7b245b8a55d02781537ebee51))
* lien rôles Ansible et formatage des tfvars ([f22d0e2](https://github.com/wbatchayon/observability-platform/commit/f22d0e23e94f2815e1f78da5fd00491c23367093))
* **review:** câblage GitOps clusters/&lt;env&gt;, NetworkPolicies ingress, PVC files OTel, sélecteur Alertmanager, projets Harbor charts/library, robustesse buckets ([c74763d](https://github.com/wbatchayon/observability-platform/commit/c74763d929437d8cb42f683c878f0e42c9f2d147))
* **review:** durcissement strict du miroir containerd air-gap (idempotent, sandbox image, vérification bloquante) ([717553a](https://github.com/wbatchayon/observability-platform/commit/717553a01a42efb679154f9906c342b588718dcb))
