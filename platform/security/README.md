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
