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
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | (optionnel) connexion « Se connecter avec GitHub » (OAuth App) |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | (optionnel) connexion « Se connecter avec Google » (Gmail) |
| `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` / `OIDC_LABEL` | (optionnel) connexion **SSO** OIDC générique (Okta, Auth0, Keycloak, Azure AD…) |
| `GITHUB_SERVICE_TOKEN` | jeton GitHub de service — **requis pour les connexions Google/SSO** (le serveur agit sur le dépôt avec ce jeton) |
| `ALLOWED_EMAILS` / `ALLOWED_EMAIL_DOMAIN` | autorisation des connexions Google/SSO (liste d'emails ou domaine) |
| `GUI_BASE_URL` | (optionnel) URL publique de la console pour les callbacks OAuth (sinon dérivée des en-têtes) |
| `DEPLOY_REF` | (optionnel) ref Git ciblée par les dispatch (défaut `main`) |
| `ALLOWED_GITHUB_LOGINS` | (optionnel) allowlist de logins autorisés (séparés par des virgules) |
| `ALLOWED_GITHUB_ORG` | (optionnel) organisation dont l'appartenance autorise l'accès |
| `TOOL_GRAFANA_URL`, `TOOL_PROMETHEUS_URL`, `TOOL_ALERTMANAGER_URL`, `TOOL_ONEUPTIME_URL`, `TOOL_GLPI_URL`, `TOOL_SLACK_URL`, `TOOL_HARBOR_URL`, `TOOL_VAULT_URL`, `TOOL_MINIO_URL`, `TOOL_RENOVATE_URL` | URLs des outils déployés (page **Outils**) |

## Connexion

Plusieurs fournisseurs, affichés s'ils sont configurés. Callback : `/api/auth/<provider>/callback`.

| Méthode | Activation | Autorisation |
|---|---|---|
| **Google (Gmail)** | `GOOGLE_OAUTH_CLIENT_ID/SECRET` + `GITHUB_SERVICE_TOKEN` | `ALLOWED_EMAILS` / `ALLOWED_EMAIL_DOMAIN` |
| **SSO (OIDC)** | `OIDC_ISSUER` + `OIDC_CLIENT_ID/SECRET` + `GITHUB_SERVICE_TOKEN` | `ALLOWED_EMAILS` / `ALLOWED_EMAIL_DOMAIN` |
| **GitHub (OAuth)** | `GITHUB_OAUTH_CLIENT_ID/SECRET` | accès en écriture au dépôt |
| **Jeton GitHub** | toujours disponible (lien « Générer un jeton ») | accès en écriture au dépôt |

> **Google/SSO** authentifient l'**identité** ; les actions GitHub (PR, secrets, pipelines) sont
> ensuite exécutées par le serveur avec **`GITHUB_SERVICE_TOKEN`**. Sans ce jeton, seules les
> connexions GitHub (OAuth/jeton) permettent d'agir.

Exemple (callback) : pour Google, *Authorized redirect URI* =
`https://<domaine>/api/auth/google/callback`.

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

- **Contrôle d'accès** : GitHub → accès en écriture au dépôt (ou `ALLOWED_GITHUB_LOGINS` /
  `ALLOWED_GITHUB_ORG`) ; Google/SSO → `ALLOWED_EMAILS` / `ALLOWED_EMAIL_DOMAIN`. Connexion refusée
  sinon.
- En-têtes de sécurité (CSP, X-Frame-Options DENY, HSTS, etc.).
- Jeton utilisateur en session chiffrée (jamais loggé, jamais persisté).
- Secrets via sealed box → GitHub Secrets (jamais en clair).
- Validation systématique des entrées (zod) ; conteneur non-root, lecture seule.
