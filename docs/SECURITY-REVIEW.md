# Revue de sécurité — Plateforme d'Observabilité

> Date : 2026-06-19 · Périmètre : ensemble du monorepo IaC (bootstrap, platform, ingress, ansible, CI).

## Synthèse

Posture globale **solide** (mTLS de bout en bout, secrets chiffrés, deny-by-default, policy-as-code,
supply chain signée). Une faille de cohérence réseau a été corrigée pendant la revue. Quelques
points d'attention résiduels, acceptables et documentés.

## Constats

### 🔴 Corrigé — NetworkPolicies : egress manquant entre couches
Les `default-deny` couvrent l'**egress**, mais seuls des `ingress` inter-couches étaient définis.
Conséquence : le Gateway n'aurait pas pu joindre les backends, ni les backends MinIO.
**Correctif** : ajout de `network-policies/allow-egress.yaml` (ingestion→backends, backends→storage,
visualization→backends/monitoring, monitoring→scrape, intra-ingestion).

### 🟢 Secrets — conforme
- Aucun secret en clair (vérifié par grep ; CI : gitleaks/trivy).
- SOPS+age configuré (`.sops.yaml`), `.gitignore` exclut tout plaintext.
- Injection via `secretKeyRef` / substitution Flux / `TF_VAR_*`. Placeholders `REMPLACEZ` non sensibles.

### 🟢 mTLS / PKI — conforme
- Vault PKI (racine + intermédiaire) → cert-manager (`vault-issuer`) → certificats sur agent, edge,
  gateway, backends, Grafana, ingress. TLS 1.3 + HSTS sur l'ingress.

### 🟢 Admission / durcissement — conforme
- Kyverno (Enforce) : images signées (cosign), interdiction `:latest`, non-root, requests/limits.
- Pod Security Standards `restricted` sur les namespaces de données.

### 🟡 Air-gap repo APT/YUM : vérification de signature
`install-debian.yaml` utilise `[trusted=yes]` et `install-rhel.yaml` `gpgcheck=false`.
**Acceptable** car dépôt interne sur réseau privé + import contrôlé (checksums + GPG à l'import dans
Harbor). **Recommandation** : signer le dépôt interne et activer `gpgcheck` pour une défense en
profondeur.

### 🟡 Vault auto-unseal
Le descellement est manuel par défaut (documenté). **Recommandation prod** : activer l'auto-unseal
(Transit/KMS) pour éviter l'exposition des clés d'unseal.

### 🟡 Harbor robot account / rétention
Compte robot read-only pour les VMs : OK. **Recommandation** : rotation périodique du token robot.

## Couverture CI (bloquante)
`gitleaks`, `trivy` (config + secrets), `checkov`, `tfsec`, `kubescape`, `conftest`/OPA, SBOM
(syft) + signature `cosign`. À exécuter sur chaque PR.

## Verdict
Prêt pour intégration. Traiter les points 🟡 avant la mise en production.
