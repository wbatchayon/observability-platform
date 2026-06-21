"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const ids = ["validate", "bootstrap", "deploy"] as const;

export default function PipelinesPage() {
  const { t } = useI18n();
  const [environment, setEnvironment] = useState("dev");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(pipeline: string) {
    setBusy(pipeline);
    setMsg(null);
    const r = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline, environment }),
    });
    const d = await r.json();
    setBusy(null);
    setMsg(r.ok ? `✅ ${t("pipe.dispatched", { pipeline, env: environment })}` : `❌ ${d.error || t("pipe.fail")}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("pipe.title")}</h1>

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

      <div className="grid gap-4 sm:grid-cols-3">
        {ids.map((id) => (
          <div key={id} className="card flex flex-col gap-3">
            <div>
              <div className="text-lg font-medium">{t(`pipe.${id}`)}</div>
              <p className="mt-1 text-sm text-slate-400">{t(`pipe.${id}.desc`)}</p>
            </div>
            <button onClick={() => run(id)} disabled={!!busy} className="btn mt-auto">
              {busy === id ? t("pipe.dispatching") : t("pipe.run", { label: t(`pipe.${id}`) })}
            </button>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm break-all">{msg}</p>}
    </div>
  );
}
