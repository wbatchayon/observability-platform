"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge, SlidersHorizontal, Lock, Rocket, Github, Info, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Dashboard() {
  const { t } = useI18n();
  const [login, setLogin] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setLogin(d.login))
      .catch(() => setLogin(null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="card flex items-start gap-4">
        <div className="icon-tile h-14 w-14">
          <Gauge className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
          <p className="mt-1 max-w-2xl text-slate-400">{t("dash.subtitle")}</p>
        </div>
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

      <div>
        <h2 className="mb-3 text-lg font-medium">{t("dash.steps")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard n={1} icon={<SlidersHorizontal className="h-5 w-5" />} titleKey="dash.s1.title" descKey="dash.s1.desc" href="/environments" />
          <StepCard n={2} icon={<Lock className="h-5 w-5" />} titleKey="dash.s2.title" descKey="dash.s2.desc" href="/environments" />
          <StepCard n={3} icon={<Rocket className="h-5 w-5" />} titleKey="dash.s3.title" descKey="dash.s3.desc" href="/pipelines" />
        </div>
      </div>
    </div>
  );
}

function StepCard({
  n,
  icon,
  titleKey,
  descKey,
  href,
}: {
  n: number;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  href: string;
}) {
  const { t } = useI18n();
  return (
    <Link href={href} className="card card-hover group flex flex-col">
      <div className="flex items-center justify-between">
        <div className="icon-tile">{icon}</div>
        <span className="font-mono text-xs text-slate-500">0{n}</span>
      </div>
      <div className="mt-4 text-lg font-medium">{t(titleKey)}</div>
      <p className="mt-1 text-sm text-slate-400">{t(descKey)}</p>
      <ArrowRight className="mt-4 h-5 w-5 text-accent transition group-hover:translate-x-1" />
    </Link>
  );
}
