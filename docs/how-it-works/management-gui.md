# Console de management (GUI)

Interface web pour **configurer, valider, lancer et suivre** les pipelines de la plateforme
**sans modifier le code source**. Code : [`gui/`](../../gui/).

## Architecture

```
Navigateur ─▶ Console Next.js (namespace gui, TLS vault-issuer)
   ├─ /api/auth         session (cookie httpOnly chiffré, token GitHub de l'utilisateur)
   ├─ /api/environments ─▶ API GitHub Contents ─▶ PR sur environments/<env>/env-values.yaml
   ├─ /api/secrets      ─▶ GitHub Environment Secrets (sealed box, scoped par env) — credentials chiffrés
   ├─ /api/pipelines    ─▶ API GitHub workflow_dispatch ─▶ .github/workflows/deploy.yaml
   └─ /api/runs         ─▶ API GitHub Actions (suivi statut/logs)
deploy.yaml ─ validate (runner hébergé) | bootstrap/deploy (runner self-hosted, cluster air-gap)
```

## Parcours utilisateur

1. **Compte** : coller un token GitHub (scope `repo`, `workflow`) → session chiffrée.
2. **Configuration** : saisir les valeurs d'un environnement → validées (zod) → **PR** créée
   automatiquement (aucune édition manuelle de fichier).
3. **Credentials** : saisir les secrets → posés en **GitHub Environment Secrets** (chiffrés, scopés
   par environnement). Au `deploy`, `deploy.yaml` matérialise le Secret `env-secrets` dans le
   cluster à partir de ces secrets → ils sont substitués par Flux dans la plateforme (bout en bout).
4. **Pipelines** : bouton `validate` / `bootstrap` / `deploy` → déclenche `deploy.yaml`.
5. **Suivi** : tableau des exécutions (statut, conclusion, lien logs), rafraîchissement auto.
6. **Outils** : après déploiement, accès direct aux interfaces des composants (Grafana,
   Prometheus, Alertmanager, OneUptime, GLPI, **Slack** — notifications via OneUptime —, Harbor,
   Vault, MinIO, **Renovate** — patch management) via les variables `TOOL_*`.

## Sécurité

- Token utilisateur : session **cookie httpOnly chiffré** (iron-session), jamais persisté ni loggé.
- Secrets : **sealed box** (clé publique du dépôt) → GitHub Secrets ; jamais transmis en clair.
- Entrées **validées** (zod) côté serveur.
- Conteneur **non-root, readOnlyRootFilesystem**, `automountServiceAccountToken: false`.
- **NetworkPolicies** deny-by-default ; TLS via `vault-issuer` ; entrée via HAProxy uniquement.

## Déploiement

```bash
# Build + push de l'image dans Harbor
cd gui && docker build -t harbor.observability.internal/library/observability-gui:0.1.0 . && \
  docker push harbor.observability.internal/library/observability-gui:0.1.0
# Manifestes (substitution Flux : GUI_DOMAIN, HARBOR_REGISTRY, GUI_SESSION_SECRET, GUI_GITHUB_REPOSITORY)
kubectl apply -k gui/deploy/   # ou via FluxCD
```

Variables/secrets requis : `GUI_DOMAIN`, `HARBOR_REGISTRY`, `GUI_SESSION_SECRET` (≥32c, SOPS),
`GUI_GITHUB_REPOSITORY` (`owner/repo`).

## Limites (versions ultérieures)

- OAuth GitHub (au lieu d'un token collé), RBAC multi-utilisateurs, secrets par **Environment**
  GitHub, diff de configuration en direct, streaming des logs de run.
