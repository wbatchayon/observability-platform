"use client";

import { useState } from "react";

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
};

export default function EnvironmentsPage() {
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
    setCfgMsg(r.ok ? `✅ PR créée : ${d.prUrl}` : `❌ ${d.error}${fmtIssues(d.issues)}`);
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
    setSecMsg(r.ok ? `✅ Secrets posés : ${d.secretsSet.join(", ")}` : `❌ ${d.error}${fmtIssues(d.issues)}`);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Configuration d&apos;environnement</h1>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Valeurs (non sensibles)</h2>
          <span className="text-xs text-slate-500">écrites via PR dans environments/&lt;env&gt;/</span>
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
          Valider &amp; créer la PR
        </button>
        {cfgMsg && <p className="text-sm break-all">{cfgMsg}</p>}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Credentials (sensibles)</h2>
          <span className="text-xs text-slate-500">chiffrés → GitHub Secrets (jamais en clair)</span>
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
          Enregistrer les credentials
        </button>
        {secMsg && <p className="text-sm break-all">{secMsg}</p>}
      </section>
    </div>
  );
}

function fmtIssues(issues?: Record<string, string[]>) {
  if (!issues) return "";
  return " — " + Object.entries(issues).map(([k, v]) => `${k}: ${v.join(",")}`).join(" ; ");
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
