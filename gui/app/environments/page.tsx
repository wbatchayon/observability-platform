"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const defaults = {
  environment: "dev",
  HARBOR_REGISTRY: "harbor.observability.internal",
  VAULT_ADDR: "https://vault.vault.svc.cluster.local:8200",
  TENANT_ID: "observability",
  MINIO_REPLICAS: "4",
  MINIO_VOLUME_SIZE: "50Gi",
  LOKI_RETENTION: "168h",
  MIMIR_RETENTION: "720h",
  TEMPO_RETENTION: "168h",
  OTEL_GATEWAY_REPLICAS: "2",
  TRACE_SAMPLING_PERCENT: "50",
  GRAFANA_DOMAIN: "grafana.dev.observability.internal",
  OTLP_DOMAIN: "otlp.dev.observability.internal",
};

const secretDefaults = {
  environment: "dev",
  MINIO_ACCESS_KEY: "",
  MINIO_SECRET_KEY: "",
  GRAFANA_ADMIN_PASSWORD: "",
  GLPI_DB_PASSWORD: "",
  GLPI_DB_ROOT_PASSWORD: "",
  GRAFANA_OAUTH_CLIENT_SECRET: "",
  SLACK_WEBHOOK_URL: "",
  TEAMS_WEBHOOK_URL: "",
  SMTP_PASSWORD: "",
};

export default function EnvironmentsPage() {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<Record<string, string>>(defaults);
  const [sec, setSec] = useState<Record<string, string>>(secretDefaults);
  const [cfgMsg, setCfgMsg] = useState<string | null>(null);
  const [secMsg, setSecMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitConfig() {
    setBusy(true);
    setCfgMsg(null);
    const r = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const d = await r.json();
    setBusy(false);
    setCfgMsg(r.ok ? `✅ ${t("env.prCreated")} ${d.prUrl}` : `❌ ${d.error}${fmtIssues(d.issues)}`);
  }

  async function submitSecrets() {
    setBusy(true);
    setSecMsg(null);
    const r = await fetch("/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sec),
    });
    const d = await r.json();
    setBusy(false);
    setSecMsg(
      r.ok
        ? `✅ ${t("env.secretsSaved")} ${d.secretsSet.join(", ")}`
        : `❌ ${d.error}${fmtIssues(d.issues)}`,
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">{t("env.title")}</h1>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("env.values")}</h2>
          <span className="text-xs text-slate-500">{t("env.valuesHint")}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.keys(defaults).map((k) => (
            <Field
              key={k}
              name={k}
              value={cfg[k]}
              isSelect={k === "environment"}
              onChange={(v) => setCfg({ ...cfg, [k]: v })}
            />
          ))}
        </div>
        <button onClick={submitConfig} disabled={busy} className="btn">
          {t("env.validate")}
        </button>
        {cfgMsg && <p className="text-sm break-all">{cfgMsg}</p>}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("env.secrets")}</h2>
          <span className="text-xs text-slate-500">{t("env.secretsHint")}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.keys(secretDefaults).map((k) => (
            <Field
              key={k}
              name={k}
              value={sec[k]}
              isSelect={k === "environment"}
              secret={k !== "environment"}
              onChange={(v) => setSec({ ...sec, [k]: v })}
            />
          ))}
        </div>
        <button onClick={submitSecrets} disabled={busy} className="btn">
          {t("env.saveSecrets")}
        </button>
        {secMsg && <p className="text-sm break-all">{secMsg}</p>}
      </section>
    </div>
  );
}

function fmtIssues(issues?: Record<string, string[]>) {
  if (!issues) return "";
  return ". Détails : " + Object.entries(issues).map(([k, v]) => `${k} (${v.join(", ")})`).join(" ; ");
}

function Field({
  name,
  value,
  onChange,
  isSelect,
  secret,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  isSelect?: boolean;
  secret?: boolean;
}) {
  return (
    <div>
      <label className="label">{name}</label>
      {isSelect ? (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="dev">dev</option>
          <option value="staging">staging</option>
          <option value="prod">prod</option>
        </select>
      ) : (
        <input
          className="input"
          type={secret ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
