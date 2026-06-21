# Politique de sécurité

## Versions supportées

Les correctifs de sécurité sont appliqués sur la dernière version mineure publiée
(voir [CHANGELOG.md](CHANGELOG.md)). Mettez-vous à jour avant de signaler.

| Version | Supportée |
|---------|-----------|
| dernière mineure | ✅ |
| antérieures | ❌ |

## Signaler une vulnérabilité

**Ne créez pas d'issue publique pour une faille de sécurité.**

Utilisez le canal privé de GitHub :
**Security → Report a vulnerability** (GitHub Private Vulnerability Reporting)
sur https://github.com/wbatchayon/observability-platform/security/advisories/new

À défaut, contactez le mainteneur : **batchayonwilliam@gmail.com** (objet : `SECURITY`).

Merci d'inclure :
- une description et l'impact estimé ;
- les étapes de reproduction (PoC si possible) ;
- les composants/versions concernés ;
- toute atténuation connue.

## Délais (objectifs)

| Étape | Délai cible |
|-------|-------------|
| Accusé de réception | 72 h |
| Évaluation initiale (sévérité, recevabilité) | 7 jours |
| Correctif ou plan de remédiation | 30 jours (selon sévérité) |
| Divulgation coordonnée | après publication du correctif |

Nous pratiquons la **divulgation responsable** : un crédit vous sera attribué
(sauf demande contraire) une fois le correctif disponible.

## Périmètre

Sont dans le périmètre : le code de ce dépôt (Terraform, manifests Flux/Helm,
Ansible, console `gui/`, workflows CI/CD). Les vulnérabilités des projets amont
(Grafana, Loki, Vault, etc.) doivent être signalées à leurs éditeurs respectifs ;
signalez-nous toutefois une version vulnérable épinglée ici.

## Bonnes pratiques de déploiement

- Renseignez tous les secrets via **SOPS/age** (jamais en clair) — voir `.sops.yaml`.
- Conservez les policies **Kyverno** en `Enforce` en production.
- Gardez les **NetworkPolicies** deny-by-default activées (CNI compatible requis).
- Faites tourner régulièrement `make scan` (gitleaks, trivy, checkov, tfsec, kubescape).
