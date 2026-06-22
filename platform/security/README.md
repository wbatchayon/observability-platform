# platform/security - Sécurité de la plateforme

Fondation DevSecOps appliquée par FluxCD : namespaces durcis, **mTLS**, **deny-by-default**,
policy-as-code, RBAC.

## Ce que cette brique produit

- **`ClusterIssuer` `vault-issuer`** - émetteur cert-manager adossé à la **PKI Vault**
  (`pki_int/sign/observability`), authentifié via l'auth Kubernetes (rôle `cert-manager`).
  **Toutes les autres briques** (storage, backends, ingestion, visualization, ingress) y
  réfèrent pour obtenir leurs certificats mTLS.
- **Namespaces** de la plateforme avec Pod Security Standards (`restricted`).
- **NetworkPolicies deny-by-default** + flux explicitement autorisés (DNS, ingestion→backends,
  backends→storage, visualization→backends, monitoring→scrape).
- **Kyverno** + policies en mode `Enforce` : images signées depuis le registre interne,
  interdiction `:latest`, non-root, requests/limits obligatoires.
- **RBAC** : rôle viewer pour l'exploitation.

## Consomme

- Vault PKI (bootstrap/10-vault) : `${VAULT_ADDR}` injecté par Flux `postBuild` depuis
  `environments/<env>/security.values.yaml`.

## Dépendance d'ordre

cert-manager + le `ClusterIssuer` doivent être prêts **avant** les briques qui demandent des
certificats. Flux gère cela via les `dependsOn` des Kustomizations d'environnement.

## Désactiver les NetworkPolicies (NETWORK_POLICIES_ENABLED)

La variable `NETWORK_POLICIES_ENABLED` (env-values) est **documentaire** : kustomize ne peut
pas supprimer conditionnellement une ressource à partir d'une variable substituée par Flux.

Sur un cluster sans CNI gérant l'API NetworkPolicy (ou si l'on souhaite s'en passer
temporairement), deux options :

1. **Commenter les ressources** (le plus simple) - dans `platform/security/kustomization.yaml`,
   mettez en commentaire les 5 lignes `network-policies/*` du bloc dédié.
2. **Overlay/Component dédié** - voir `platform-overlays/` pour l'approche par overlay
   (le composant `platform-overlays/openshift/` et les overlays air-gap/internet montrent le
   patron). Un composant `disable-network-policies` peut retirer ces ressources via
   `patches` de type `$patch: delete` si vous préférez un overlay versionné.
