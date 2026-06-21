#!/usr/bin/env bash
# Vérifie qu'un cluster cible remplit les prérequis de la plateforme.
# Usage : KUBECONFIG=... bash ci/preflight.sh
# Non bloquant : signale les manques (exit 1 si un prérequis dur manque).
set -uo pipefail

ok()   { echo "  ✅ $*"; }
warn() { echo "  ⚠️  $*"; }
ko()   { echo "  ❌ $*"; FAIL=1; }
FAIL=0

echo "== Pré-vol plateforme d'observabilité =="

# 1. Accès cluster
if ! kubectl version -o json >/dev/null 2>&1; then
  ko "kubectl ne joint pas le cluster (KUBECONFIG ?)"; exit 1
fi
ok "Accès cluster OK"

# 2. Version Kubernetes >= 1.25
MINOR=$(kubectl version -o json 2>/dev/null | grep -oE '"minor": *"[0-9]+' | grep -oE '[0-9]+' | head -1)
if [ -n "${MINOR:-}" ] && [ "$MINOR" -ge 25 ]; then ok "Kubernetes 1.${MINOR} (>= 1.25)"; else ko "Kubernetes 1.${MINOR:-?} < 1.25"; fi

# 3. StorageClass par défaut OU variable STORAGE_CLASS
DEFAULT_SC=$(kubectl get sc -o jsonpath='{range .items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")]}{.metadata.name}{"\n"}{end}' 2>/dev/null)
if [ -n "$DEFAULT_SC" ]; then ok "StorageClass par défaut : $DEFAULT_SC"
elif [ -n "${STORAGE_CLASS:-}" ]; then ok "STORAGE_CLASS fourni : $STORAGE_CLASS"
else ko "Aucune StorageClass par défaut et STORAGE_CLASS non défini (installez local-path)"; fi

# 4. Capacité LoadBalancer OU NodePort
LB_TYPE="${LB_SERVICE_TYPE:-LoadBalancer}"
if [ "$LB_TYPE" = "NodePort" ]; then ok "Exposition via NodePort (LB_SERVICE_TYPE=NodePort)"
else
  if kubectl get svc -A -o jsonpath='{.items[?(@.spec.type=="LoadBalancer")].status.loadBalancer.ingress}' 2>/dev/null | grep -q .; then
    ok "LoadBalancer fonctionnel détecté"
  else
    warn "Aucun LoadBalancer actif détecté : installez MetalLB ou utilisez LB_SERVICE_TYPE=NodePort"
  fi
fi

# 5. CNI compatible NetworkPolicy (heuristique)
if [ "${NETWORK_POLICIES_ENABLED:-true}" = "true" ]; then
  if kubectl get pods -n kube-system 2>/dev/null | grep -qiE 'calico|cilium|canal|weave|antrea'; then
    ok "CNI compatible NetworkPolicy détecté"
  else
    warn "CNI NetworkPolicy non détecté (Flannel/VPC-CNI ?) : vérifiez ou NETWORK_POLICIES_ENABLED=false"
  fi
fi

echo "== Fin du pré-vol =="
exit $FAIL
