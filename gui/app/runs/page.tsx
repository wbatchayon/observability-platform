"use client";

import { useCallback, useEffect, useState } from "react";

interface Run {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  event: string;
  branch: string | null;
  createdAt: string;
  url: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/runs");
    if (r.status === 401) {
      setAuthRequired(true);
      setErr(null);
      setLoading(false);
      return;
    }
    const d = await r.json();
    if (r.ok) {
      setRuns(d.runs);
      setErr(null);
    } else {
      setErr(d.error || "Erreur");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (authRequired) return; // pas de polling tant que non authentifié
    const t = setInterval(load, 10000); // rafraîchissement auto (suivi)
    return () => clearInterval(t);
  }, [load, authRequired]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Suivi des exécutions</h1>
        <button onClick={load} className="btn-ghost">
          Rafraîchir
        </button>
      </div>

      {authRequired && (
        <div className="card border-warn/30">
          <p className="text-sm">
            Connectez-vous depuis l&apos;onglet <span className="font-medium">Compte</span> pour
            suivre les exécutions.
          </p>
        </div>
      )}
      {err && <p className="text-sm text-bad">❌ {err}</p>}
      {loading && <p className="text-sm text-slate-400">Chargement…</p>}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-edge/50 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2">Workflow</th>
              <th className="px-4 py-2">Branche</th>
              <th className="px-4 py-2">Événement</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-edge">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-slate-400">{r.branch}</td>
                <td className="px-4 py-2 text-slate-400">{r.event}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={r.status} conclusion={r.conclusion} />
                </td>
                <td className="px-4 py-2 text-right">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-accent underline">
                    Voir les logs
                  </a>
                </td>
              </tr>
            ))}
            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Aucune exécution.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status, conclusion }: { status: string | null; conclusion: string | null }) {
  if (status !== "completed") {
    return <span className="badge bg-warn/20 text-warn">{status || "?"}</span>;
  }
  if (conclusion === "success") {
    return <span className="badge bg-ok/20 text-ok">success</span>;
  }
  return <span className="badge bg-bad/20 text-bad">{conclusion || "failure"}</span>;
}
