"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gauge,
  Github,
  Info,
  ArrowRight,
  ExternalLink,
  Activity,
  BarChart3,
  Database,
  Boxes,
  KeyRound,
  ShieldAlert,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface RunRef {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  createdAt: string;
  url: string;
}
interface EnvSummary {
  environment: string;
  lastRun: RunRef | null;
}
interface ToolRef {
  key: string;
  name: string;
  url: string | null;
}
interface Health {
  status: "ok" | "degraded" | "running" | "unknown";
  failures: number;
  inProgress: number;
  total: number;
}
interface DashboardData {
  environments: EnvSummary[];
  tools: ToolRef[];
  health: Health;
  recentRuns: RunRef[];
}

const toolIcons: Record<string, LucideIcon> = {
  grafana: BarChart3,
  minio: Database,
  harbor: Boxes,
  vault: KeyRound,
  oneuptime: ShieldAlert,
  glpi: Ticket,
};

export default function Dashboard() {
  const { t } = useI18n();
  const [login, setLogin] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setLogin(d.login))
      .catch(() => setLogin(null));
  }, []);

  useEffect(() => {
    if (!login) {
      setLoading(false);
      return;
    }
    let cancel = false;
    const load = () => {
      fetch("/api/dashboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancel) setData(d);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancel) setLoading(false);
        });
    };
    load();
    const tmr = setInterval(load, 15000);
    return () => {
      cancel = true;
      clearInterval(tmr);
    };
  }, [login]);

  return (
    <div className="space-y-6">
      <section className="card flex items-start gap-4">
        <div className="icon-tile h-14 w-14">
          <Gauge className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="mt-1 max-w-2xl text-slate-400">{t("dash.subtitle")}</p>
        </div>
        {data && <HealthBadge health={data.health} />}
      </section>

      {!login ? (
        <div className="card flex flex-col items-start justify-between gap-3 border-accent/30 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm">{t("dash.notConnected")}</p>
          </div>
          <Link href="/login" className="btn whitespace-nowrap">
            <Github className="h-4 w-4" />
            {t("dash.signin")}
          </Link>
        </div>
      ) : (
        <div className="card flex items-center gap-3 border-ok/30">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <p className="text-sm text-slate-300">{t("dash.connectedAs", { login })}</p>
        </div>
      )}

      {login && (
        <>
          {/* Environnements + état du dernier déploiement */}
          <section className="space-y-3">
            <h2 className="text-lg font-medium">{t("dash.environments")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {(data?.environments ?? placeholderEnvs).map((e) => (
                <div key={e.environment} className="card flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm uppercase tracking-wide text-slate-300">
                      {e.environment}
                    </span>
                    <RunStatus run={e.lastRun} />
                  </div>
                  <div className="text-xs text-slate-400">
                    {e.lastRun ? (
                      <a href={e.lastRun.url} target="_blank" rel="noreferrer" className="text-accent underline break-all">
                        {e.lastRun.name}
                      </a>
                    ) : (
                      <span>{t("dash.noDeploy")}</span>
                    )}
                  </div>
                  <Link href="/pipelines" className="btn-ghost mt-auto text-xs">
                    {t("dash.deployBtn")}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Accès direct aux outils déployés */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t("dash.tools")}</h2>
              <Link href="/tools" className="text-sm text-accent underline">
                {t("dash.allTools")}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.tools ?? []).map((tl) => {
                const Icon = toolIcons[tl.key] ?? Boxes;
                const enabled = !!tl.url;
                const body = (
                  <>
                    <div className="icon-tile">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {tl.name}
                      {enabled && <ExternalLink className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    {!enabled && (
                      <span className="badge bg-warn/15 text-warn">{t("tools.notConfigured")}</span>
                    )}
                  </>
                );
                return enabled ? (
                  <a
                    key={tl.key}
                    href={tl.url as string}
                    target="_blank"
                    rel="noreferrer"
                    className="card card-hover flex items-center gap-3"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={tl.key} className="card flex items-center gap-3 opacity-70">
                    {body}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Exécutions récentes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{t("dash.recentRuns")}</h2>
              <Link href="/runs" className="text-sm text-accent underline">
                {t("dash.allRuns")}
              </Link>
            </div>
            <div className="card p-0 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <tbody>
                  {(data?.recentRuns ?? []).map((r) => (
                    <tr key={r.id} className="border-t border-edge first:border-t-0">
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">
                        <RunStatus run={r} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link href={`/runs?run=${r.id}`} className="text-accent underline">
                          {t("dash.viewSteps")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loading && (data?.recentRuns?.length ?? 0) === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500">{t("runs.none")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const placeholderEnvs: EnvSummary[] = [
  { environment: "dev", lastRun: null },
  { environment: "staging", lastRun: null },
  { environment: "prod", lastRun: null },
];

function HealthBadge({ health }: { health: Health }) {
  const { t } = useI18n();
  const map: Record<Health["status"], string> = {
    ok: "bg-ok/20 text-ok",
    degraded: "bg-bad/20 text-bad",
    running: "bg-warn/20 text-warn",
    unknown: "bg-white/10 text-slate-400",
  };
  return (
    <span className={`badge h-fit ${map[health.status]}`}>
      <Activity className="mr-1 h-3.5 w-3.5" />
      {t(`dash.health.${health.status}`)}
    </span>
  );
}

function RunStatus({ run }: { run: RunRef | null }) {
  if (!run) return <span className="badge bg-white/10 text-slate-400">—</span>;
  if (run.status !== "completed") {
    return <span className="badge bg-warn/20 text-warn">{run.status || "?"}</span>;
  }
  if (run.conclusion === "success") {
    return <span className="badge bg-ok/20 text-ok">success</span>;
  }
  return <span className="badge bg-bad/20 text-bad">{run.conclusion || "failure"}</span>;
}
