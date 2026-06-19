#!/usr/bin/env bash
# Validation du monorepo : lint + kubeconform (manifests K8s) + terraform validate.
set -euo pipefail
cd "$(dirname "$0")/.."

rc=0
have() { command -v "$1" >/dev/null 2>&1; }
warn() { echo "⚠️  $1 absent — étape ignorée."; }

echo "### 1/3 — Lint"
bash ci/lint.sh || rc=1

echo "### 2/3 — terraform validate"
if have terraform; then
  while IFS= read -r d; do
    echo "==> terraform validate $d"
    ( cd "$d" && terraform init -backend=false -input=false >/dev/null && terraform validate ) || rc=1
  done < <(find bootstrap -type f -name '*.tf' -exec dirname {} \; | sort -u)
else warn terraform; fi

echo "### 3/3 — kubeconform (manifests Kubernetes/Flux)"
if have kubeconform; then
  # Schémas CRD (Flux, cert-manager, Kyverno, Prometheus-operator) via dépôt de schémas.
  find platform ingress -type f \( -name '*.yaml' -o -name '*.yml' \) -print0 \
    | xargs -0 -r kubeconform -strict -ignore-missing-schemas \
        -schema-location default \
        -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' \
    || rc=1
else warn kubeconform; fi

[ "$rc" -eq 0 ] && echo "✅ Validation OK" || echo "❌ Validation a relevé des erreurs"
exit "$rc"
