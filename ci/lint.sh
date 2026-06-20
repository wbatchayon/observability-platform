#!/usr/bin/env bash
# Lint du monorepo : YAML, Terraform, Ansible, Helm.
# Chaque outil absent émet un avertissement (n'échoue pas), chaque outil présent bloque sur erreur.
set -euo pipefail
cd "$(dirname "$0")/.."

rc=0
have() { command -v "$1" >/dev/null 2>&1; }
warn() { echo "⚠️  $1 absent - étape ignorée (installez-le pour une validation complète)."; }

echo "==> yamllint"
if have yamllint; then yamllint . || rc=1; else warn yamllint; fi

echo "==> terraform fmt (check)"
if have terraform; then terraform fmt -recursive -check || rc=1; else warn terraform; fi

echo "==> tflint"
if have tflint; then
  while IFS= read -r d; do
    (cd "$d" && tflint --chdir=. ) || rc=1
  done < <(find bootstrap -type f -name '*.tf' -exec dirname {} \; | sort -u)
else warn tflint; fi

echo "==> ansible-lint"
if have ansible-lint; then ansible-lint ansible/ || rc=1; else warn ansible-lint; fi

echo "==> helm lint"
if have helm; then
  echo "   (les HelmRelease Flux ne sont pas des charts locaux ; helm lint s'applique aux charts locaux le cas échéant)"
else warn helm; fi

[ "$rc" -eq 0 ] && echo "✅ Lint OK" || echo "❌ Lint a relevé des erreurs"
exit "$rc"
