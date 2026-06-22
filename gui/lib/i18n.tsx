"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "fr" | "en";

type Dict = Record<string, string>;

const fr: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.config": "Configuration",
  "nav.pipelines": "Pipelines",
  "nav.runs": "Suivi",
  "nav.tools": "Outils",
  "nav.patch": "Patch management",
  "nav.account": "Compte",

  "dash.title": "Console de management",
  "dash.subtitle":
    "Configurez vos environnements, gérez vos identifiants et pilotez vos pipelines CI/CD en toute sécurité, sans modifier le code source.",
  "dash.notConnected": "Vous n'êtes pas connecté. Connectez-vous avec votre jeton GitHub pour commencer.",
  "dash.signin": "Se connecter avec GitHub",
  "dash.connectedAs": "Connecté en tant que {login}.",
  "dash.steps": "Démarrez en 3 étapes",
  "dash.step": "Étape",
  "dash.s1.title": "Configurer",
  "dash.s1.desc": "Renseignez les valeurs d'un environnement. Elles sont validées puis proposées dans une Pull Request.",
  "dash.s2.title": "Identifiants",
  "dash.s2.desc": "Enregistrez vos identifiants de façon chiffrée dans GitHub Secrets.",
  "dash.s3.title": "Lancer et suivre",
  "dash.s3.desc": "Déclenchez la validation, le provisionnement ou le déploiement, puis suivez l'exécution.",

  "login.title": "Connexion",
  "login.connectedAs": "Connecté :",
  "login.signout": "Se déconnecter",
  "login.providerSection": "Connexion avec un fournisseur",
  "login.signinWith": "Se connecter avec {label}",
  "login.tokenSection": "Connexion par jeton GitHub",
  "login.tokenSectionAlt": "Ou par jeton GitHub",
  "login.tokenLabel": "Jeton GitHub (portées repo et workflow)",
  "login.generate": "Générer un jeton (portées pré-remplies)",
  "login.tokenBtn": "Se connecter avec un jeton",
  "login.connecting": "Connexion…",
  "login.note":
    "Accès réservé aux identités autorisées (email/domaine pour Google/SSO, accès en écriture au dépôt pour GitHub). Aucune donnée sensible n'est stockée côté serveur.",
  "login.connected": "Connecté.",
  "login.disconnected": "Déconnecté.",
  "login.fail": "Échec de connexion.",
  "err.state": "Échec de vérification de sécurité (state). Réessayez.",
  "err.token": "Échec de l'échange OAuth. Réessayez.",
  "err.forbidden": "Accès refusé : identité non autorisée (email/domaine ou accès au dépôt).",
  "err.provider_disabled": "Ce fournisseur de connexion n'est pas configuré sur ce serveur.",

  "env.title": "Configuration d'environnement",
  "env.values": "Valeurs (non sensibles)",
  "env.valuesHint": "Proposées dans une Pull Request",
  "env.secrets": "Identifiants (sensibles)",
  "env.secretsHint": "Chiffrés dans GitHub Secrets, jamais en clair",
  "env.validate": "Valider et créer la Pull Request",
  "env.saveSecrets": "Enregistrer les identifiants",
  "env.prCreated": "Pull Request créée :",
  "env.secretsSaved": "Identifiants enregistrés :",

  "pipe.title": "Pipelines",
  "pipe.envTarget": "Environnement cible",
  "pipe.note": "Déclenche le workflow de déploiement via l'API GitHub, sans modifier le code source.",
  "pipe.run": "Lancer {label}",
  "pipe.dispatching": "Déclenchement…",
  "pipe.dispatched": "Pipeline « {pipeline} » déclenché pour {env}. Consultez l'onglet Suivi.",
  "pipe.fail": "Échec",
  "pipe.validate": "Validation",
  "pipe.validate.desc": "Lint, kubeconform et scans de sécurité. Aucun déploiement.",
  "pipe.bootstrap": "Provisionnement",
  "pipe.bootstrap.desc": "Provisionne le socle : cluster, Harbor, Vault puis Flux.",
  "pipe.deploy": "Déploiement",
  "pipe.deploy.desc": "Réconcilie la plateforme via FluxCD.",

  "runs.title": "Suivi des exécutions",
  "runs.refresh": "Rafraîchir",
  "runs.loading": "Chargement…",
  "runs.none": "Aucune exécution.",
  "runs.workflow": "Workflow",
  "runs.branch": "Branche",
  "runs.event": "Événement",
  "runs.status": "Statut",
  "runs.logs": "Voir les logs",
  "runs.authRequired": "Connectez-vous depuis l'onglet Compte pour suivre les exécutions.",

  "tools.title": "Outils de la plateforme",
  "tools.subtitle": "Accès direct aux interfaces des composants déployés.",
  "tools.footer":
    "Les URLs sont fournies par les variables TOOL_* (renseignées après déploiement, ou injectées par Flux/Helm). Les outils non renseignés apparaissent « non configuré ».",
  "tools.notConfigured": "non configuré",
  "tools.authRequired": "Connectez-vous depuis l'onglet Compte pour accéder aux outils.",
};

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.config": "Configuration",
  "nav.pipelines": "Pipelines",
  "nav.runs": "Runs",
  "nav.tools": "Tools",
  "nav.patch": "Patch management",
  "nav.account": "Account",

  "dash.title": "Management console",
  "dash.subtitle":
    "Configure your environments, manage your credentials and drive your CI/CD pipelines securely, without touching the source code.",
  "dash.notConnected": "You are not signed in. Sign in with your GitHub token to get started.",
  "dash.signin": "Sign in with GitHub",
  "dash.connectedAs": "Signed in as {login}.",
  "dash.steps": "Get started in 3 steps",
  "dash.step": "Step",
  "dash.s1.title": "Configure",
  "dash.s1.desc": "Enter an environment's values. They are validated then proposed in a Pull Request.",
  "dash.s2.title": "Credentials",
  "dash.s2.desc": "Store your credentials encrypted in GitHub Secrets.",
  "dash.s3.title": "Launch & track",
  "dash.s3.desc": "Trigger validation, provisioning or deployment, then track the run.",

  "login.title": "Sign in",
  "login.connectedAs": "Signed in:",
  "login.signout": "Sign out",
  "login.providerSection": "Sign in with a provider",
  "login.signinWith": "Sign in with {label}",
  "login.tokenSection": "Sign in with a GitHub token",
  "login.tokenSectionAlt": "Or with a GitHub token",
  "login.tokenLabel": "GitHub token (repo and workflow scopes)",
  "login.generate": "Generate a token (scopes pre-filled)",
  "login.tokenBtn": "Sign in with a token",
  "login.connecting": "Signing in…",
  "login.note":
    "Access restricted to authorized identities (email/domain for Google/SSO, write access to the repo for GitHub). No sensitive data is stored server-side.",
  "login.connected": "Signed in.",
  "login.disconnected": "Signed out.",
  "login.fail": "Sign-in failed.",
  "err.state": "Security check failed (state). Please retry.",
  "err.token": "OAuth exchange failed. Please retry.",
  "err.forbidden": "Access denied: identity not authorized (email/domain or repo access).",
  "err.provider_disabled": "This sign-in provider is not configured on this server.",

  "env.title": "Environment configuration",
  "env.values": "Values (non-sensitive)",
  "env.valuesHint": "Proposed in a Pull Request",
  "env.secrets": "Credentials (sensitive)",
  "env.secretsHint": "Encrypted in GitHub Secrets, never in clear text",
  "env.validate": "Validate and create the Pull Request",
  "env.saveSecrets": "Save credentials",
  "env.prCreated": "Pull Request created:",
  "env.secretsSaved": "Credentials saved:",

  "pipe.title": "Pipelines",
  "pipe.envTarget": "Target environment",
  "pipe.note": "Triggers the deployment workflow via the GitHub API, without touching the source code.",
  "pipe.run": "Run {label}",
  "pipe.dispatching": "Triggering…",
  "pipe.dispatched": "Pipeline \"{pipeline}\" triggered for {env}. See the Runs tab.",
  "pipe.fail": "Failed",
  "pipe.validate": "Validation",
  "pipe.validate.desc": "Lint, kubeconform and security scans. No deployment.",
  "pipe.bootstrap": "Provisioning",
  "pipe.bootstrap.desc": "Provisions the base: cluster, Harbor, Vault then Flux.",
  "pipe.deploy": "Deployment",
  "pipe.deploy.desc": "Reconciles the platform via FluxCD.",

  "runs.title": "Run history",
  "runs.refresh": "Refresh",
  "runs.loading": "Loading…",
  "runs.none": "No runs.",
  "runs.workflow": "Workflow",
  "runs.branch": "Branch",
  "runs.event": "Event",
  "runs.status": "Status",
  "runs.logs": "View logs",
  "runs.authRequired": "Sign in from the Account tab to track runs.",

  "tools.title": "Platform tools",
  "tools.subtitle": "Direct access to the deployed components' interfaces.",
  "tools.footer":
    "URLs come from the TOOL_* variables (set after deployment, or injected by Flux/Helm). Unset tools show as \"not configured\".",
  "tools.notConfigured": "not configured",
  "tools.authRequired": "Sign in from the Account tab to access the tools.",
};

// Catégories + descriptions des outils (clé = tool.key).
const toolsFr: Dict = {
  "grafana.cat": "Visualisation", "grafana.desc": "Tableaux de bord des logs, métriques et traces, corrélés.",
  "prometheus.cat": "Monitoring", "prometheus.desc": "Métriques et règles d'alerte de la plateforme.",
  "alertmanager.cat": "Alerting", "alertmanager.desc": "Routage et inhibition des alertes.",
  "oneuptime.cat": "Incidents", "oneuptime.desc": "Disponibilité, statut et webhooks d'alerte.",
  "glpi.cat": "Incidents", "glpi.desc": "Tickets et cycle de vie des incidents.",
  "slack.cat": "Notifications", "slack.desc": "Notifications d'astreinte (problèmes majeurs) émises par OneUptime.",
  "renovate.cat": "Patch management", "renovate.desc": "Mises à jour automatiques des outils par Pull Request.",
  "harbor.cat": "Supply chain", "harbor.desc": "Registre OCI et dépôt de paquets pour les environnements isolés d'Internet.",
  "vault.cat": "Sécurité", "vault.desc": "Secrets et PKI mTLS de la plateforme.",
  "minio.cat": "Stockage", "minio.desc": "Console du stockage objet S3 (archivage long terme).",
};
const toolsEn: Dict = {
  "grafana.cat": "Visualization", "grafana.desc": "Correlated logs, metrics and traces dashboards.",
  "prometheus.cat": "Monitoring", "prometheus.desc": "Platform metrics and alerting rules.",
  "alertmanager.cat": "Alerting", "alertmanager.desc": "Alert routing and inhibition.",
  "oneuptime.cat": "Incidents", "oneuptime.desc": "Availability, status and alert webhooks.",
  "glpi.cat": "Incidents", "glpi.desc": "Tickets and incident lifecycle.",
  "slack.cat": "Notifications", "slack.desc": "On-call notifications (major issues) sent by OneUptime.",
  "renovate.cat": "Patch management", "renovate.desc": "Automatic tool updates via Pull Request.",
  "harbor.cat": "Supply chain", "harbor.desc": "OCI registry and package repository for air-gapped environments.",
  "vault.cat": "Security", "vault.desc": "Platform secrets and mTLS PKI.",
  "minio.cat": "Storage", "minio.desc": "S3 object storage console (long-term archival).",
};

const dicts: Record<Locale, Dict> = { fr: { ...fr }, en: { ...en } };
const toolDicts: Record<Locale, Dict> = { fr: toolsFr, en: toolsEn };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  tool: (key: string, field: "cat" | "desc") => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale | null) || null;
    if (saved === "fr" || saved === "en") {
      setLocaleState(saved);
    } else if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) {
      setLocaleState("en");
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("locale", l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  };

  const t = (key: string, params?: Record<string, string>) => {
    let s = dicts[locale][key] ?? dicts.fr[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };

  const tool = (key: string, field: "cat" | "desc") =>
    toolDicts[locale][`${key}.${field}`] ?? toolDicts.fr[`${key}.${field}`] ?? "";

  return <Ctx.Provider value={{ locale, setLocale, t, tool }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
