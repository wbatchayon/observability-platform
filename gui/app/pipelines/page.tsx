"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Server,
  Rocket,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { clusterProviders, lbServiceTypes, chartSources } from "@/lib/validation";

// Étapes de l'assistant de déploiement reflétant le vrai flux.
// `action` = action réellement supportée par le workflow deploy.yaml (null = pas de dispatch direct).
const steps = [
  { id: "preflight", icon: Search, action: "validate" },
  { id: "bootstrap", icon: Server, action: "bootstrap" },
  { id: "deploy", icon: Rocket, action: "deploy" },
  { id: "verify", icon: CheckCircle2, action: "deploy" },
] as const;

type StepId = (typeof steps)[number]["id"];

export default function PipelinesPage() {
  const { t } = useI18n();
  const [environment, setEnvironment] = useState("dev");
  const [active, setActive] = useState<StepId>("preflight");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Knobs de portabilité écrits dans env-values via PR (réutilise /api/environments).
  const [provider, setProvider] = useState<string>("kubeadm");
  const [storageClass, setStorageClass] = useState("standard");
  const [lbType, setLbType] = useState<string>("LoadBalancer");
  const [chartSource, setChartSource] = useState<string>("airgap");
  const [netpol, setNetpol] = useState<string>("true");
  const [cfgMsg, setCfgMsg] = useState<string | null>(null);

  async function dispatch(stepId: StepId) {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    setBusy(stepId);
    setMsg(null);
    const r = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline: step.action, environment }),
    });
    const d = await r.json();
    setBusy(null);
    setMsg(
      r.ok
        ? `✅ ${t("pipe.dispatched", { pipeline: t(`pipe.${stepId}`), env: environment })}`
        : `❌ ${d.error || t("pipe.fail")}`,
    );
  }

  // Écrit les knobs de portabilité dans environments/<env>/env-values.yaml via PR.
  // On ne renvoie que les champs nécessaires : la route fusionne avec les valeurs par défaut.
  async function saveKnobs() {
    setBusy("knobs");
    setCfgMsg(null);
    const r = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        environment,
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
        GRAFANA_DOMAIN: `grafana.${environment}.observability.internal`,
        OTLP_DOMAIN: `otlp.${environment}.observability.internal`,
        CLUSTER_PROVIDER: provider,
        STORAGE_CLASS: storageClass,
        LB_SERVICE_TYPE: lbType,
        CHART_SOURCE: chartSource,
        NETWORK_POLICIES_ENABLED: netpol,
      }),
    });
    const d = await r.json();
    setBusy(null);
    setCfgMsg(r.ok ? `✅ ${t("env.prCreated")} ${d.prUrl}` : `❌ ${d.error || t("pipe.fail")}`);
  }

  const activeIdx = steps.findIndex((s) => s.id === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pipe.title")}</h1>
        <p className="mt-1 text-slate-400">{t("pipe.wizard.subtitle")}</p>
      </div>

      {/* Cible + assistant par étapes */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <label className="label">{t("pipe.envTarget")}</label>
          <select className="input" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <p className="text-xs text-slate-500 sm:self-end sm:pb-2">{t("pipe.note")}</p>
      </div>

      {/* Knobs de portabilité (cluster + réseau + stockage + source des charts) */}
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-medium">{t("pipe.portability")}</h2>
        </div>
        <p className="text-sm text-slate-400">{t("pipe.portability.desc")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Selector
            label={t("pipe.knob.provider")}
            value={provider}
            onChange={setProvider}
            options={[...clusterProviders]}
          />
          <div>
            <label className="label">{t("pipe.knob.storageClass")}</label>
            <input className="input" value={storageClass} onChange={(e) => setStorageClass(e.target.value)} />
          </div>
          <Selector
            label={t("pipe.knob.lbType")}
            value={lbType}
            onChange={setLbType}
            options={[...lbServiceTypes]}
          />
          <Selector
            label={t("pipe.knob.chartSource")}
            value={chartSource}
            onChange={setChartSource}
            options={[...chartSources]}
          />
          <Selector
            label={t("pipe.knob.netpol")}
            value={netpol}
            onChange={setNetpol}
            options={["true", "false"]}
          />
        </div>
        <button onClick={saveKnobs} disabled={!!busy} className="btn">
          {busy === "knobs" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("pipe.saveKnobs")}
        </button>
        {cfgMsg && <p className="text-sm break-all">{cfgMsg}</p>}
      </section>

      {/* Frise des étapes */}
      <div className="card overflow-x-auto">
        <ol className="flex min-w-[640px] items-center">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === active;
            const done = i < activeIdx;
            return (
              <li key={s.id} className="flex flex-1 items-center">
                <button
                  onClick={() => setActive(s.id)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition ${
                    isActive ? "bg-accent/15" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                      isActive
                        ? "border-accent bg-accent/20 text-accent"
                        : done
                          ? "border-ok/50 bg-ok/15 text-ok"
                          : "border-white/15 text-slate-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-xs font-medium ${isActive ? "text-white" : "text-slate-400"}`}>
                    {t(`pipe.${s.id}`)}
                  </span>
                </button>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Détail de l'étape active */}
      <div className="card space-y-4">
        <div>
          <div className="text-lg font-medium">{t(`pipe.${active}`)}</div>
          <p className="mt-1 text-sm text-slate-400">{t(`pipe.${active}.desc`)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => dispatch(active)} disabled={!!busy} className="btn">
            {busy === active ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {busy === active ? t("pipe.dispatching") : t("pipe.run", { label: t(`pipe.${active}`) })}
          </button>
          <Link href="/runs" className="btn-ghost">
            {t("pipe.goRuns")}
          </Link>
        </div>
      </div>

      {msg && <p className="text-sm break-all">{msg}</p>}
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
