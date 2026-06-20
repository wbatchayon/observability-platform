# Console de management (GUI)

Interface web moderne pour piloter la plateforme d'observabilité **sans modifier le code source** :
saisie de configuration, credentials sécurisés, déclenchement et suivi des pipelines CI/CD.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind. Routes API serveur (Node) pour parler à l'API
GitHub.

## Fonctionnalités

| Page | Rôle |
|---|---|
| **Compte** | Connexion via token GitHub → session cookie **httpOnly chiffré** (rien de persistant côté serveur) |
| **Configuration** | Saisie validée (zod) des valeurs d'un environnement → écrites via **PR** (`environments/<env>/env-values.yaml`) |
| **Credentials** | Secrets posés en **GitHub Actions Secrets** (sealed box) — jamais en clair |
| **Pipelines** | Déclenche `validate` / `bootstrap` / `deploy` via **workflow_dispatch** |
| **Suivi** | Statut/conclusion/liens des exécutions (rafraîchissement auto) |

## Variables d'environnement (serveur)

| Variable | Rôle |
|---|---|
| `SESSION_SECRET` | clé de chiffrement de session (≥ 32 caractères) |
| `GITHUB_REPOSITORY` | dépôt cible au format `owner/repo` |

## Développement

```bash
npm install
export SESSION_SECRET="$(openssl rand -hex 24)"
export GITHUB_REPOSITORY="wbatchayon/observability-platform"
npm run dev   # http://localhost:3000
```

## Build / image

```bash
npm run build           # vérifie le build (standalone)
docker build -t harbor.observability.internal/library/observability-gui:0.1.0 .
```

## Déploiement Vercel (dev)

```bash
cd gui
vercel deploy --yes \
  -e SESSION_SECRET="$(openssl rand -hex 24)" \
  -e GITHUB_REPOSITORY="wbatchayon/observability-platform"
```

`output: standalone` est désactivé automatiquement sur Vercel (variable `VERCEL`) — Vercel utilise
son adaptateur natif ; le mode standalone reste actif pour l'image Docker/air-gap.

## Déploiement Kubernetes (prod / air-gap)

Manifestes K8s dans [`deploy/`](deploy/) (Deployment non-root, Service, Certificate `vault-issuer`,
NetworkPolicies, Ingress). Image tirée depuis Harbor (air-gap). Voir
`docs/how-it-works/management-gui.md`.

## Sécurité

- Token utilisateur en session chiffrée (jamais loggé, jamais persisté).
- Secrets via sealed box → GitHub Secrets (jamais en clair).
- Validation systématique des entrées (zod) ; conteneur non-root, lecture seule.
