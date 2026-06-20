"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge, SlidersHorizontal, Lock, Rocket, Github, Info, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [login, setLogin] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setLogin(d.login))
      .catch(() => setLogin(null));
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card flex items-start gap-4">
        <div className="icon-tile h-14 w-14">
          <Gauge className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Console de management</h1>
          <p className="mt-1 max-w-2xl text-slate-400">
            Configurez vos environnements, posez vos credentials et pilotez les pipelines CI/CD —
            sans modifier le code source.
          </p>
        </div>
      </section>

      {/* Bandeau de connexion */}
      {!login ? (
        <div className="card flex flex-col items-start justify-between gap-3 border-accent/30 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-accent" />
            <p className="text-sm">
              Vous n&apos;êtes pas connecté. Connectez-vous avec votre token GitHub pour commencer.
            </p>
          </div>
          <Link href="/login" className="btn whitespace-nowrap">
            <Github className="h-4 w-4" />
            Se connecter avec GitHub
          </Link>
        </div>
      ) : (
        <div className="card flex items-center gap-3 border-ok/30">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <p className="text-sm text-slate-300">
            Connecté en tant que <span className="font-medium text-white">{login}</span>.
          </p>
        </div>
      )}

      {/* Étapes */}
      <div>
        <h2 className="mb-3 text-lg font-medium">Démarrez en 3 étapes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard
            n={1}
            icon={<SlidersHorizontal className="h-5 w-5" />}
            title="Configurer"
            href="/environments"
            desc="Saisir les valeurs d'un environnement (validées, écrites par PR)."
          />
          <StepCard
            n={2}
            icon={<Lock className="h-5 w-5" />}
            title="Credentials"
            href="/environments"
            desc="Poser les secrets de façon chiffrée (GitHub Secrets)."
          />
          <StepCard
            n={3}
            icon={<Rocket className="h-5 w-5" />}
            title="Lancer & suivre"
            href="/pipelines"
            desc="Déclencher validate / bootstrap / deploy et suivre l'exécution."
          />
        </div>
      </div>
    </div>
  );
}

function StepCard({
  n,
  icon,
  title,
  href,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  href: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card card-hover group flex flex-col">
      <div className="flex items-center justify-between">
        <div className="icon-tile">{icon}</div>
        <span className="font-mono text-xs text-slate-500">0{n}</span>
      </div>
      <div className="mt-4 text-lg font-medium">{title}</div>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
      <ArrowRight className="mt-4 h-5 w-5 text-accent transition group-hover:translate-x-1" />
    </Link>
  );
}
