# Plateforme d'Observabilité - orchestration locale
# Principe : on change les valeurs/credentials de environments/$(ENV)/ puis on lance.
#
# Usage : make <cible> ENV=dev|staging|prod   (ENV par défaut : dev)

ENV ?= dev
ENV_DIR := environments/$(ENV)
# Ordre d'amorçage air-gap : cluster -> Harbor (registre, seedé) -> Vault -> Flux.
# Harbor passe avant Vault car il sert ensuite images et charts à tout le reste.
BOOTSTRAP_DIRS := bootstrap/00-cluster bootstrap/30-package-repo bootstrap/10-vault bootstrap/20-flux

SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help
help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: check-env
check-env: ## Vérifie que environments/$(ENV) existe
	@test -d "$(ENV_DIR)" || { \
		echo "❌ Environnement '$(ENV)' introuvable ($(ENV_DIR))."; \
		echo "   Créez-le : cp -r environments/_template environments/$(ENV)"; \
		exit 1; }
	@echo "✅ Environnement : $(ENV)"

.PHONY: bootstrap
bootstrap: check-env ## Provisionne le socle (cluster -> Harbor -> Vault -> Flux)
	@for d in $(BOOTSTRAP_DIRS); do \
		echo "==> terraform apply $$d ($(ENV))"; \
		terraform -chdir=$$d init -input=false; \
		terraform -chdir=$$d apply -auto-approve \
			-var-file="$(CURDIR)/$(ENV_DIR)/$$(basename $$d).tfvars" || exit 1; \
	done

.PHONY: deploy
deploy: check-env ## Réconcilie la plateforme via FluxCD
	@echo "==> Flux reconcile ($(ENV))"
	flux reconcile kustomization platform --with-source

.PHONY: preflight
preflight: ## Vérifie les prérequis du cluster cible (SC, LB, version K8s, CNI)
	@bash ci/preflight.sh

.PHONY: validate
validate: ## Valide tout le repo (lint + kubeconform + terraform validate)
	@bash ci/validate.sh

.PHONY: lint
lint: ## Lint (yaml, terraform, ansible, helm)
	@bash ci/lint.sh

.PHONY: scan
scan: ## Scans de sécurité (trivy, checkov, gitleaks, kubescape)
	@bash ci/scan.sh

.PHONY: encrypt
encrypt: check-env ## Chiffre les secrets de l'environnement (SOPS)
	@find $(ENV_DIR) -name '*.secret.yaml' -o -name 'secrets*.yaml' | while read -r f; do \
		echo "🔒 $$f"; sops --encrypt --in-place "$$f"; done

.PHONY: decrypt
decrypt: check-env ## Déchiffre les secrets de l'environnement (SOPS)
	@find $(ENV_DIR) -name '*.secret.yaml' -o -name 'secrets*.yaml' | while read -r f; do \
		echo "🔓 $$f"; sops --decrypt --in-place "$$f"; done

.PHONY: clean
clean: ## Nettoie les artefacts locaux (.terraform, plans, sbom)
	@find . -type d -name '.terraform' -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -type f \( -name '*.tfplan' -o -name '*.sbom.json' \) -delete 2>/dev/null || true
	@echo "🧹 Nettoyé."
