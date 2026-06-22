import { z } from "zod";

// Fournisseurs de cluster supportés (portabilité multi-cloud / on-prem / air-gap).
export const clusterProviders = ["kubeadm", "existing", "eks", "gke", "aks", "talos"] as const;
export type ClusterProvider = (typeof clusterProviders)[number];

// Types de Service exposant le load balancer (portabilité réseau).
export const lbServiceTypes = ["LoadBalancer", "NodePort", "ClusterIP"] as const;

// Source des charts (Internet vs registre OCI interne pour les environnements isolés).
export const chartSources = ["upstream", "harbor"] as const;

// Knobs de portabilité — valeurs optionnelles avec défauts sûrs (alignés sur tfvars/env-values).
export const portabilitySchema = z.object({
  CLUSTER_PROVIDER: z.enum(clusterProviders).default("kubeadm"),
  STORAGE_CLASS: z.string().min(1).default("standard"),
  LB_SERVICE_TYPE: z.enum(lbServiceTypes).default("LoadBalancer"),
  CHART_SOURCE: z.enum(chartSources).default("upstream"),
  NETWORK_POLICIES_ENABLED: z.enum(["true", "false"]).default("true"),
});

export type Portability = z.infer<typeof portabilitySchema>;

// Valeurs non sensibles d'un environnement (alignées sur environments/<env>/env-values.yaml).
export const envValuesSchema = z
  .object({
    environment: z.enum(["dev", "staging", "prod"]),
    HARBOR_REGISTRY: z.string().min(1),
    VAULT_ADDR: z.string().url().or(z.string().startsWith("https://")),
    TENANT_ID: z.string().min(1),
    MINIO_REPLICAS: z.coerce.number().int().min(1),
    MINIO_VOLUME_SIZE: z.string().regex(/^\d+(Gi|Ti)$/),
    LOKI_RETENTION: z.string().regex(/^\d+h$/),
    MIMIR_RETENTION: z.string().regex(/^\d+h$/),
    TEMPO_RETENTION: z.string().regex(/^\d+h$/),
    OTEL_GATEWAY_REPLICAS: z.coerce.number().int().min(1),
    TRACE_SAMPLING_PERCENT: z.coerce.number().int().min(0).max(100),
    GRAFANA_DOMAIN: z.string().min(3),
    OTLP_DOMAIN: z.string().min(3),
  })
  .merge(portabilitySchema);

export type EnvValues = z.infer<typeof envValuesSchema>;

// Secrets d'un environnement (posés en secrets scopés par GitHub Environment, jamais en clair).
// Couvre l'ensemble des clés du Secret `env-secrets` consommé par Flux (les facultatives peuvent
// rester vides selon les composants activés).
export const secretsSchema = z.object({
  environment: z.enum(["dev", "staging", "prod"]),
  MINIO_ACCESS_KEY: z.string().min(3),
  MINIO_SECRET_KEY: z.string().min(8),
  GRAFANA_ADMIN_PASSWORD: z.string().min(8),
  GLPI_DB_PASSWORD: z.string().min(8),
  GLPI_DB_ROOT_PASSWORD: z.string().min(8),
  GRAFANA_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
  SLACK_WEBHOOK_URL: z.string().optional().default(""),
  TEAMS_WEBHOOK_URL: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
});

// Actions réellement supportées par le workflow deploy.yaml (inputs.action).
// Les étapes de l'assistant (preflight/verify) sont mappées vers ces actions côté UI.
export const dispatchSchema = z.object({
  pipeline: z.enum(["validate", "bootstrap", "deploy"]),
  environment: z.enum(["dev", "staging", "prod"]),
});

// Génère le YAML du ConfigMap env-values à partir des valeurs validées.
export function toEnvValuesYaml(v: EnvValues): string {
  const data: Record<string, string> = {
    ENVIRONMENT: v.environment,
    TENANT_ID: v.TENANT_ID,
    VAULT_ADDR: v.VAULT_ADDR,
    HARBOR_REGISTRY: v.HARBOR_REGISTRY,
    MINIO_REPLICAS: String(v.MINIO_REPLICAS),
    MINIO_VOLUME_SIZE: v.MINIO_VOLUME_SIZE,
    LOKI_RETENTION: v.LOKI_RETENTION,
    MIMIR_RETENTION: v.MIMIR_RETENTION,
    TEMPO_RETENTION: v.TEMPO_RETENTION,
    OTEL_GATEWAY_REPLICAS: String(v.OTEL_GATEWAY_REPLICAS),
    TRACE_SAMPLING_PERCENT: String(v.TRACE_SAMPLING_PERCENT),
    GRAFANA_DOMAIN: v.GRAFANA_DOMAIN,
    OTLP_DOMAIN: v.OTLP_DOMAIN,
    // Knobs de portabilité (cluster + réseau + stockage + source des charts).
    CLUSTER_PROVIDER: v.CLUSTER_PROVIDER,
    STORAGE_CLASS: v.STORAGE_CLASS,
    LB_SERVICE_TYPE: v.LB_SERVICE_TYPE,
    CHART_SOURCE: v.CHART_SOURCE,
    NETWORK_POLICIES_ENABLED: v.NETWORK_POLICIES_ENABLED,
  };
  const lines = Object.entries(data).map(([k, val]) => `  ${k}: ${JSON.stringify(val)}`);
  return [
    "---",
    "apiVersion: v1",
    "kind: ConfigMap",
    "metadata:",
    "  name: env-values",
    "  namespace: flux-system",
    "data:",
    ...lines,
    "",
  ].join("\n");
}

// --- Patch management : versions des charts pilotables depuis la console ---
// Chaque entrée correspond à une clé *_CHART_VERSION du ConfigMap env-values,
// substituée par Flux dans le chart.spec.version du HelmRelease correspondant.
export const chartComponents = [
  { key: "CERT_MANAGER_CHART_VERSION", label: "cert-manager", ns: "security" },
  { key: "KYVERNO_CHART_VERSION", label: "Kyverno", ns: "security" },
  { key: "MINIO_CHART_VERSION", label: "MinIO", ns: "storage" },
  { key: "LOKI_CHART_VERSION", label: "Loki", ns: "backends" },
  { key: "MIMIR_CHART_VERSION", label: "Mimir", ns: "backends" },
  { key: "TEMPO_CHART_VERSION", label: "Tempo", ns: "backends" },
  { key: "OTEL_CHART_VERSION", label: "OpenTelemetry Collector", ns: "ingestion" },
  { key: "KUBE_PROM_STACK_CHART_VERSION", label: "kube-prometheus-stack", ns: "monitoring" },
  { key: "GRAFANA_CHART_VERSION", label: "Grafana", ns: "visualization" },
  { key: "ONEUPTIME_CHART_VERSION", label: "OneUptime", ns: "incident" },
] as const;

export type ChartComponentKey = (typeof chartComponents)[number]["key"];
const chartKeys = chartComponents.map((c) => c.key);

// Une version de chart : SemVer simple (avec préfixe v optionnel, ex. v1.14.4 / 6.6.2).
const versionRe = /^v?\d+\.\d+(\.\d+)?([-.][0-9A-Za-z.-]+)?$/;

// Valide un lot {KEY: version} : seules les clés connues, versions au bon format.
export function validateChartVersions(input: Record<string, string>): {
  ok: boolean;
  values: Record<string, string>;
  errors: string[];
} {
  const values: Record<string, string> = {};
  const errors: string[] = [];
  for (const [k, v] of Object.entries(input || {})) {
    if (!chartKeys.includes(k as ChartComponentKey)) continue; // ignore clés inconnues
    const val = String(v).trim();
    if (!versionRe.test(val)) {
      errors.push(`${k}: version invalide "${val}"`);
      continue;
    }
    values[k] = val;
  }
  return { ok: errors.length === 0, values, errors };
}

// --- Credentials unifiés : tout ce que l'utilisateur saisit, posé en secrets ---
// Chaque champ est écrit comme secret du GitHub Environment (sealed box), consommé
// par les workflows (Terraform/Ansible/déploiement) — jamais en clair.
export type CredField = { key: string; label: string; multiline?: boolean; placeholder?: string };
export type CredGroup = { id: string; title: string; fields: CredField[] };

export const credentialGroups: CredGroup[] = [
  {
    id: "cloud",
    title: "Infrastructure / Cloud (providers Terraform)",
    fields: [
      { key: "PROXMOX_VE_API_TOKEN", label: "Proxmox API token", placeholder: "user@pam!id=uuid" },
      { key: "AWS_ACCESS_KEY_ID", label: "AWS Access Key ID" },
      { key: "AWS_SECRET_ACCESS_KEY", label: "AWS Secret Access Key" },
      { key: "GOOGLE_CREDENTIALS", label: "GCP Service Account (JSON)", multiline: true },
      { key: "ARM_CLIENT_ID", label: "Azure Client ID" },
      { key: "ARM_CLIENT_SECRET", label: "Azure Client Secret" },
      { key: "ARM_SUBSCRIPTION_ID", label: "Azure Subscription ID" },
      { key: "ARM_TENANT_ID", label: "Azure Tenant ID" },
    ],
  },
  {
    id: "ansible",
    title: "Ansible (configuration des VMs air-gap)",
    fields: [
      { key: "ANSIBLE_SSH_PRIVATE_KEY", label: "Clé SSH privée", multiline: true },
      { key: "ANSIBLE_VAULT_PASSWORD", label: "Mot de passe Ansible Vault" },
    ],
  },
  {
    id: "core",
    title: "Vault & Registre",
    fields: [
      { key: "VAULT_TOKEN", label: "Vault token (bootstrap)" },
      { key: "HARBOR_USERNAME", label: "Harbor — utilisateur/robot" },
      { key: "HARBOR_PASSWORD", label: "Harbor — mot de passe/jeton" },
    ],
  },
  {
    id: "platform",
    title: "Plateforme (env-secrets)",
    fields: [
      { key: "MINIO_ACCESS_KEY", label: "MinIO Access Key" },
      { key: "MINIO_SECRET_KEY", label: "MinIO Secret Key" },
      { key: "GRAFANA_ADMIN_PASSWORD", label: "Grafana — mot de passe admin" },
      { key: "GLPI_DB_PASSWORD", label: "GLPI — mot de passe BD" },
      { key: "GLPI_DB_ROOT_PASSWORD", label: "GLPI — mot de passe BD root" },
    ],
  },
  {
    id: "notif",
    title: "Authentification & Notifications",
    fields: [
      { key: "GRAFANA_OAUTH_CLIENT_SECRET", label: "Grafana OAuth — client secret" },
      { key: "SLACK_WEBHOOK_URL", label: "Slack — webhook" },
      { key: "TEAMS_WEBHOOK_URL", label: "Teams — webhook" },
      { key: "SMTP_PASSWORD", label: "SMTP — mot de passe" },
    ],
  },
];

const credKeys = credentialGroups.flatMap((g) => g.fields.map((f) => f.key));

// Valide un lot de credentials : environment + clés connues uniquement (toutes facultatives).
export function validateCredentials(environment: string, input: Record<string, unknown>): {
  ok: boolean;
  environment: string;
  values: Record<string, string>;
  error?: string;
} {
  if (!["dev", "staging", "prod"].includes(environment)) {
    return { ok: false, environment, values: {}, error: "Environnement invalide" };
  }
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(input || {})) {
    if (!credKeys.includes(k)) continue;
    const val = typeof v === "string" ? v.trim() : "";
    if (val) values[k] = val;
  }
  return { ok: true, environment, values };
}
