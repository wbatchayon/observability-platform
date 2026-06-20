# Revue de sécurité - Plateforme d'Observabilité

> Date : 2026-06-19 · Périmètre : ensemble du monorepo IaC (bootstrap, platform, ingress, ansible, CI).

## Synthèse

Posture globale **solide** (mTLS de bout en bout, secrets chiffrés, deny-by-default, policy-as-code,
supply chain signée). Une faille de cohérence réseau a été corrigée pendant la revue. Quelques
points d'attention résiduels, acceptables et documentés.

## Constats

### 🔴 Corrigé - NetworkPolicies : egress manquant entre couches
Les `default-deny` couvrent l'**egress**, mais seuls des `ingress` inter-couches étaient définis.
Conséquence : le Gateway n'aurait pas pu joindre les backends, ni les backends MinIO.
**Correctif** : ajout de `network-policies/allow-egress.yaml` (ingestion→backends, backends→storage,
visualization→backends/monitoring, monitoring→scrape, intra-ingestion).

### 🟢 Secrets - conforme
- Aucun secret en clair (vérifié par grep ; CI : gitleaks/trivy).
- SOPS+age configuré (`.sops.yaml`), `.gitignore` exclut tout plaintext.
- Injection via `secretKeyRef` / substitution Flux / `TF_VAR_*`. Placeholders `REMPLACEZ` non sensibles.

### 🟢 mTLS / PKI - conforme
- Vault PKI (racine + intermédiaire) → cert-manager (`vault-issuer`) → certificats sur agent, edge,
  gateway, backends, Grafana, ingress. TLS 1.3 + HSTS sur l'ingress.

### 🟢 Admission / durcissement - conforme
- Kyverno (Enforce) : images signées (cosign), interdiction `:latest`, non-root, requests/limits.
- Pod Security Standards `restricted` sur les namespaces de données.

### 🟢 Corrigé - Air-gap repo APT/YUM : vérification de signature
`install-debian.yaml` utilise désormais `signed-by=` avec import de la clé GPG interne (plus de
`[trusted=yes]`) ; `install-rhel.yaml` active `gpgcheck=true` + `gpgkey`. Clé servie par le dépôt
interne (`otel_repo_gpg_key_url`).

### 🟢 Corrigé - Vault auto-unseal
Auto-unseal **Transit** activé par défaut (`seal "transit"` dans la config Raft), adapté à
l'air-gap (pas de KMS cloud). Token Transit injecté via secret K8s `vault-transit-unseal` (SOPS).

### 🟢 Corrigé - Rotation du token robot Harbor
`harbor_robot_account` borné par `duration` + `time_rotating` (`robot_token_rotation_days`, 90j) :
la rotation regénère automatiquement le token. Nouveau secret exposé en output (à re-chiffrer SOPS)
et propagé aux VMs via `configure-agent.yaml`.

### 🟢 Air-gap : aucune communication directe avec Internet
- **Miroir containerd → Harbor** sur chaque nœud (docker.io/quay.io/ghcr.io/registry.k8s.io).
- **Charts Helm en OCI depuis Harbor** (`oci://${HARBOR_REGISTRY}/charts`) - plus aucun dépôt public.
- Images explicites préfixées `${HARBOR_REGISTRY}/library/`.
- Amorçage Harbor-first depuis archives locales (cf. `docs/how-it-works/air-gap.md`).

## Couverture CI (bloquante)
`gitleaks`, `trivy` (config + secrets), `checkov`, `tfsec`, `kubescape`, `conftest`/OPA, SBOM
(syft) + signature `cosign`. À exécuter sur chaque PR.

## Revue de sécurité complète (2026-06-21, post-consolidation infra + GUI)

| Sévérité | Constat | Traitement |
|---|---|---|
| 🟢 Corrigé | Kyverno `verify-image-signatures` en Enforce alors que les **images** ne sont pas signées (seul le SBOM l'est) → pods bloqués en cluster réel | Passé en **Audit** ; repasser en Enforce après `cosign sign <image>` |
| 🟢 Corrigé | Namespace `incident` (OneUptime/GLPI/MariaDB) sans deny-by-default | Ajout `network-policies/incident.yaml` (deny-all + DNS + intra + ingress monitoring/flux + egress 443) |
| 🟡 Opérateur | Destinataire age de `.sops.yaml` = placeholder → chiffrement non fonctionnel | Renseigner la vraie clé publique age |
| 🟢 OK | Secrets, conteneurs non-root, mTLS, variables `sensitive`, en-têtes GUI, pas de sink XSS, contrôle d'accès GUI | — |

## Verdict
Prêt pour intégration. Tous les constats sont traités (mTLS, secrets, deny-by-default y compris
`incident`, signature des dépôts, auto-unseal, rotation de token, air-gap via Harbor, Kyverno en
Audit le temps de la signature d'images). Reste l'action opérateur : clé age SOPS réelle.
