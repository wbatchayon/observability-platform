#!/usr/bin/env bash
# Scans de sécurité : secrets, IaC, manifests K8s.
set -euo pipefail
cd "$(dirname "$0")/.."

rc=0
have() { command -v "$1" >/dev/null 2>&1; }
warn() { echo "⚠️  $1 absent - étape ignorée."; }

echo "==> gitleaks (secrets)"
if have gitleaks; then gitleaks detect --no-banner --redact || rc=1; else warn gitleaks; fi

echo "==> trivy (config IaC + secrets)"
if have trivy; then
  trivy config --exit-code 1 --severity HIGH,CRITICAL . || rc=1
  trivy fs --scanners secret --exit-code 1 . || rc=1
else warn trivy; fi

echo "==> checkov (IaC)"
if have checkov; then checkov -d . --quiet --compact || rc=1; else warn checkov; fi

echo "==> tfsec (Terraform)"
if have tfsec; then tfsec bootstrap/ || rc=1; else warn tfsec; fi

echo "==> kubescape (manifests K8s)"
if have kubescape; then kubescape scan framework nsa platform/ ingress/ || rc=1; else warn kubescape; fi

[ "$rc" -eq 0 ] && echo "✅ Scans OK" || echo "❌ Scans ont relevé des problèmes"
exit "$rc"
