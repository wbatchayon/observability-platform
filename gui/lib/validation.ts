import { z } from "zod";

// Valeurs non sensibles d'un environnement (alignées sur environments/<env>/env-values.yaml).
export const envValuesSchema = z.object({
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
});

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
