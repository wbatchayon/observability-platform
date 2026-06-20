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
| **Outils** | Accès direct aux interfaces déployées : Grafana, Prometheus, Alertmanager, OneUptime, GLPI, **Slack** (notifications via OneUptime), Harbor, Vault, MinIO, **Renovate** (patch management) |

## Variables d'environnement (serveur)

| Variable | Rôle |
|---|---|
| `SESSION_SECRET` | clé de chiffrement de session (≥ 32 caractères) |
| `GITHUB_REPOSITORY` | dépôt cible au format `owner/repo` |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | (optionnel) active la connexion « Se connecter avec GitHub » (OAuth App) |
| `GUI_BASE_URL` | (optionnel) URL publique de la console pour le callback OAuth (sinon dérivée des en-têtes) |
| `DEPLOY_REF` | (optionnel) ref Git ciblée par les dispatch (défaut `main`) |
| `ALLOWED_GITHUB_LOGINS` | (optionnel) allowlist de logins autorisés (séparés par des virgules) |
| `ALLOWED_GITHUB_ORG` | (optionnel) organisation dont l'appartenance autorise l'accès |
| `TOOL_GRAFANA_URL`, `TOOL_PROMETHEUS_URL`, `TOOL_ALERTMANAGER_URL`, `TOOL_ONEUPTIME_URL`, `TOOL_GLPI_URL`, `TOOL_SLACK_URL`, `TOOL_HARBOR_URL`, `TOOL_VAULT_URL`, `TOOL_MINIO_URL`, `TOOL_RENOVATE_URL` | URLs des outils déployés (page **Outils**) |

## Connexion

Deux méthodes :

1. **OAuth GitHub** (recommandé, sans jeton) : bouton « Se connecter avec GitHub ». Nécessite une
   **OAuth App** GitHub :
   - Settings → Developer settings → OAuth Apps → New OAuth App
   - Homepage URL : `https://<votre-domaine>`
   - Authorization callback URL : `https://<votre-domaine>/api/auth/oauth/callback`
   - Renseigner `GITHUB_OAUTH_CLIENT_ID` et `GITHUB_OAUTH_CLIENT_SECRET` (et `GUI_BASE_URL`).
2. **Jeton personnel** : la page de connexion propose un lien « Générer un jeton » avec les portées
   `repo` et `workflow` pré-remplies.

Dans les deux cas, l'accès exige un droit en écriture sur le dépôt (cf. contrôle d'accès).

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

- **Contrôle d'accès** : seuls les utilisateurs disposant d'un accès en écriture au dépôt (ou
  figurant dans `ALLOWED_GITHUB_LOGINS` / membres de `ALLOWED_GITHUB_ORG`) peuvent ouvrir une
  session. La connexion est refusée (403) sinon.
- En-têtes de sécurité (CSP, X-Frame-Options DENY, HSTS, etc.).
- Jeton utilisateur en session chiffrée (jamais loggé, jamais persisté).
- Secrets via sealed box → GitHub Secrets (jamais en clair).
- Validation systématique des entrées (zod) ; conteneur non-root, lecture seule.
