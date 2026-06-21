"use client";

import { useState } from "react";

const pipelines = [
  {
    id: "validate",
    label: "Validation",
    desc: "Lint, kubeconform et scans de sécurité. Aucun déploiement.",
  },
  {
    id: "bootstrap",
    label: "Provisionnement",
    desc: "Provisionne le socle : cluster, Harbor, Vault puis Flux.",
  },
  {
    id: "deploy",
    label: "Déploiement",
    desc: "Réconcilie la plateforme via FluxCD.",
  },
];

export default function PipelinesPage() {
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
    setMsg(
      r.ok
        ? `✅ Pipeline « ${pipeline} » déclenché pour ${environment}. Consultez l'onglet Suivi.`
        : `❌ ${d.error || "Échec"}`,
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pipelines</h1>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-auto">
          <label className="label">Environnement cible</label>
          <select className="input" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <p className="text-xs text-slate-500 sm:self-end sm:pb-2">
          Déclenche le workflow de déploiement via l&apos;API GitHub, sans modifier le code source.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {pipelines.map((p) => (
          <div key={p.id} className="card flex flex-col gap-3">
            <div>
              <div className="text-lg font-medium">{p.label}</div>
              <p className="text-sm text-slate-400 mt-1">{p.desc}</p>
            </div>
            <button onClick={() => run(p.id)} disabled={!!busy} className="btn mt-auto">
              {busy === p.id ? "Déclenchement…" : `Lancer ${p.label}`}
            </button>
          </div>
        ))}
      </div>

      {msg && <p className="text-sm break-all">{msg}</p>}
    </div>
  );
}
