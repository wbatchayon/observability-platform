# Automatisation des montées de version

Objectif : **tout automatiser**. Les mises à jour de versions sont détectées, testées et (pour les
plus sûres) mergées sans intervention manuelle. Les responsabilités/cadences sont définies dans le
[RACI](../governance/raci-version-upgrades.md).

## Les trois moteurs d'automatisation

| Moteur | Quoi | Déclencheur |
|---|---|---|
| **Renovate** (`.github/workflows/renovate.yml`) | Terraform + providers, charts Helm, images, GitHub Actions, collections Ansible | cron hebdo (lundi 04:00) + `workflow_dispatch` |
| **Flux Image Automation** (`clusters/<env>/`) | Nouvelle image **signée** dans Harbor → PR de bump | surveillance continue Flux |
| **Release Please** (`.github/workflows/release.yaml`) | Versioning sémantique + CHANGELOG du dépôt | push sur `main` |

## Cycle Renovate (bout en bout)

```
Renovate (cron) ─▶ détecte versions ─▶ ouvre une PR ─▶ CI (lint/scan/policy) ─▶
   ├─ patch/mineure sûre : auto-merge (platformAutomerge) une fois la CI verte
   └─ majeure : label "breaking-change", revue humaine (CAB) requise
```

- **Auto-merge** : `platformAutomerge: true` + règles `automerge` (mineur/patch des charts Helm et
  GitHub Actions) dans `.github/renovate.json`. Le merge n'a lieu **qu'après CI verte**.
- **Majeures / breaking** : `automerge: false` + label `breaking-change` → revue humaine.
- **CVE de sécurité** : `vulnerabilityAlerts` → PR priorisée, label `security`, revue humaine.
- **Stack Grafana** regroupée (`groupName: grafana-stack`) pour des PR cohérentes.

## Pré-requis (une seule fois)

1. **Secret `RENOVATE_TOKEN`** dans le dépôt : un PAT (scope `repo`, `workflow`) ou un token
   d'**App GitHub** dédié. Nécessaire pour que Renovate crée des PR **et** que la CI se déclenche
   dessus (le `GITHUB_TOKEN` par défaut ne relance pas les workflows sur les PR créées par un bot).

   ```bash
   gh secret set RENOVATE_TOKEN --body "<PAT>"
   ```

2. (Optionnel) Lancer un premier run manuel en dry-run :
   `Actions → Renovate → Run workflow → dryRun: true`.

## Air-gap

En production air-gap, Renovate tourne sur un runner interne ayant accès au miroir/registre interne
(Harbor) plutôt qu'aux registres publics ; `renovate.json` pointe alors les datasources vers le
miroir interne. Le mécanisme de PR/auto-merge reste identique.

## Vérification

- `Actions → Renovate` : le run hebdomadaire (ou manuel) s'exécute sans erreur.
- Les PR de dépendances apparaissent avec le label `dependencies` ; les sûres se mergent seules
  après CI verte ; les majeures attendent une revue.
