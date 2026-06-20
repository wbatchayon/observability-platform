# ADR 0003 — VMs air-gap gérées par Ansible, packages via Harbor

**Statut** : Accepté · **Date** : 2026-06-19

## Contexte

Les VMs ne doivent pas communiquer avec l'extérieur (contrainte de sécurité).

## Décision

- Héberger les packages OpenTelemetry Collector contrib (v0.148.0) dans un **dépôt interne
  Harbor** (`bootstrap/30-package-repo`).
- **Ansible** installe et configure les agents en tirant les packages **offline** depuis ce dépôt
  (apt/yum interne, extraction tar.gz pour Windows). Aucun accès Internet requis.
- Les agents exportent en OTLP/gRPC **mTLS** vers les Edge Collectors.

## Conséquences

- Surface d'attaque réduite (pas d'accès sortant des VMs).
- Import des packages contrôlé (vérification checksums + signature GPG).
- Fleet management idempotent et multi-OS (Debian/RHEL/Windows).
