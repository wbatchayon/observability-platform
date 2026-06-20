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

interface Tool {
  key: string;
  name: string;
  category: string;
  description: string;
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
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((d) => setTools(d.tools || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outils de la plateforme</h1>
        <p className="mt-1 text-slate-400">
          Accès direct aux interfaces des composants déployés.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const Icon = icons[t.key] ?? Boxes;
          const enabled = !!t.url;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <div className="icon-tile">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="badge bg-white/5 text-slate-400">{t.category}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-lg font-medium">
                {t.name}
                {enabled && <ExternalLink className="h-4 w-4 text-accent" />}
              </div>
              <p className="mt-1 text-sm text-slate-400">{t.description}</p>
              <p className="mt-3 text-xs">
                {enabled ? (
                  <span className="text-accent break-all">{t.url}</span>
                ) : (
                  <span className="badge bg-warn/15 text-warn">non configuré</span>
                )}
              </p>
            </>
          );
          return enabled ? (
            <a
              key={t.key}
              href={t.url as string}
              target="_blank"
              rel="noreferrer"
              className="card card-hover group flex flex-col"
            >
              {inner}
            </a>
          ) : (
            <div key={t.key} className="card flex flex-col opacity-70">
              {inner}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Les URLs sont fournies par les variables <code>TOOL_*</code> (renseignées après déploiement,
        ou injectées par Flux/Helm). Les outils non renseignés apparaissent « non configuré ».
      </p>
    </div>
  );
}
