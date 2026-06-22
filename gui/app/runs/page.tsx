"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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

interface Step {
  name: string;
  status: string | null;
  conclusion: string | null;
  number: number;
}
interface Job {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  url: string;
  steps: Step[];
}
interface RunDetail extends Run {
  jobs: Job[];
}

export default function RunsPage() {
  return (
    <Suspense fallback={null}>
      <RunsView />
    </Suspense>
  );
}

function RunsView() {
  const { t } = useI18n();
  const search = useSearchParams();
  const initialRun = search.get("run");
  const [runs, setRuns] = useState<Run[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(initialRun ? Number(initialRun) : null);

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

      <div className="space-y-3">
        {runs.map((r) => (
          <RunRow
            key={r.id}
            run={r}
            open={expanded === r.id}
            onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
          />
        ))}
        {!loading && runs.length === 0 && (
          <div className="card text-center text-slate-500">{t("runs.none")}</div>
        )}
      </div>
    </div>
  );
}

function RunRow({ run, open, onToggle }: { run: Run; open: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/runs/${run.id}`);
      if (r.ok) {
        const d = await r.json();
        setDetail(d.run);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [run.id]);

  // Charge le détail à l'ouverture, puis rafraîchit tant que l'exécution est en cours.
  useEffect(() => {
    if (!open) return;
    loadDetail();
    if (run.status === "completed") return;
    const tmr = setInterval(loadDetail, 8000);
    return () => clearInterval(tmr);
  }, [open, run.status, loadDetail]);

  return (
    <div className="card p-0 overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5">
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{run.name}</div>
          <div className="text-xs text-slate-500">
            {run.branch} · {run.event}
          </div>
        </div>
        <StatusBadge status={run.status} conclusion={run.conclusion} />
        <a
          href={run.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-accent underline"
        >
          {t("runs.logs")}
        </a>
      </button>

      {open && (
        <div className="border-t border-edge px-4 py-3">
          {loadingDetail && !detail && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("runs.loading")}
            </p>
          )}
          {detail && detail.jobs.length === 0 && (
            <p className="text-sm text-slate-500">{t("runs.noJobs")}</p>
          )}
          <div className="space-y-4">
            {detail?.jobs.map((job) => (
              <div key={job.id}>
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge status={job.status} conclusion={job.conclusion} />
                  <span className="text-sm font-medium">{job.name}</span>
                  <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
                    {t("runs.logs")}
                  </a>
                </div>
                <ol className="space-y-1 border-l border-edge pl-4">
                  {job.steps.map((s) => (
                    <li key={s.number} className="flex items-center gap-2 text-sm">
                      <StepDot status={s.status} conclusion={s.conclusion} />
                      <span className="text-slate-300">{s.name}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
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

function StepDot({ status, conclusion }: { status: string | null; conclusion: string | null }) {
  let cls = "bg-slate-600";
  if (status !== "completed") cls = "bg-warn animate-pulse";
  else if (conclusion === "success") cls = "bg-ok";
  else if (conclusion === "skipped") cls = "bg-slate-600";
  else cls = "bg-bad";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}
