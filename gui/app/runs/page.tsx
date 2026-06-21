"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
      setErr(d.error || "Error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (authRequired) return;
    const tmr = setInterval(load, 10000);
    return () => clearInterval(tmr);
  }, [load, authRequired]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("runs.title")}</h1>
        <button onClick={load} className="btn-ghost">
          {t("runs.refresh")}
        </button>
      </div>

      {authRequired && (
        <div className="card border-warn/30">
          <p className="text-sm">{t("runs.authRequired")}</p>
        </div>
      )}
      {err && <p className="text-sm text-bad">❌ {err}</p>}
      {loading && <p className="text-sm text-slate-400">{t("runs.loading")}</p>}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-edge/50 text-slate-400 text-left">
            <tr>
              <th className="px-4 py-2">{t("runs.workflow")}</th>
              <th className="px-4 py-2">{t("runs.branch")}</th>
              <th className="px-4 py-2">{t("runs.event")}</th>
              <th className="px-4 py-2">{t("runs.status")}</th>
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
                    {t("runs.logs")}
                  </a>
                </td>
              </tr>
            ))}
            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  {t("runs.none")}
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
