"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Activity,
  BellRing,
  ShieldAlert,
  Ticket,
  Boxes,
  KeyRound,
  Database,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Tool {
  key: string;
  name: string;
  url: string | null;
}

const icons: Record<string, LucideIcon> = {
  grafana: BarChart3,
  prometheus: Activity,
  alertmanager: BellRing,
  oneuptime: ShieldAlert,
  glpi: Ticket,
  harbor: Boxes,
  vault: KeyRound,
  minio: Database,
  slack: MessageSquare,
  renovate: RefreshCw,
};

export default function ToolsPage() {
  const { t, tool } = useI18n();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    fetch("/api/tools")
      .then(async (r) => {
        if (r.status === 401) {
          setAuthRequired(true);
          return { tools: [] };
        }
        return r.json();
      })
      .then((d) => setTools(d.tools || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("tools.title")}</h1>
        <p className="mt-1 text-slate-400">{t("tools.subtitle")}</p>
      </div>

      {loading && <p className="text-sm text-slate-400">{t("runs.loading")}</p>}
      {authRequired && (
        <div className="card border-warn/30">
          <p className="text-sm">{t("tools.authRequired")}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tl) => {
          const Icon = icons[tl.key] ?? Boxes;
          const enabled = !!tl.url;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <div className="icon-tile">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="badge bg-white/5 text-slate-400">{tool(tl.key, "cat")}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-lg font-medium">
                {tl.name}
                {enabled && <ExternalLink className="h-4 w-4 text-accent" />}
              </div>
              <p className="mt-1 text-sm text-slate-400">{tool(tl.key, "desc")}</p>
              <p className="mt-3 text-xs">
                {enabled ? (
                  <span className="text-accent break-all">{tl.url}</span>
                ) : (
                  <span className="badge bg-warn/15 text-warn">{t("tools.notConfigured")}</span>
                )}
              </p>
            </>
          );
          return enabled ? (
            <a key={tl.key} href={tl.url as string} target="_blank" rel="noreferrer" className="card card-hover group flex flex-col">
              {inner}
            </a>
          ) : (
            <div key={tl.key} className="card flex flex-col opacity-70">
              {inner}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">{t("tools.footer")}</p>
    </div>
  );
}
