"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <div>
        <h1 className="text-2xl font-semibold">Console de management</h1>
        <p className="text-slate-400 mt-1">
          Configurez vos environnements, posez vos credentials et pilotez les pipelines CI/CD —
          sans modifier le code source.
        </p>
      </div>

      {!login && (
        <div className="card border-warn/40">
          <p className="text-sm">
            Vous n&apos;êtes pas connecté.{" "}
            <Link href="/login" className="text-accent underline">
              Connectez-vous
            </Link>{" "}
            avec votre token GitHub pour commencer.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <Step n={1} title="Configurer" href="/environments" desc="Saisir les valeurs d'un environnement (validées, écrites par PR)." />
        <Step n={2} title="Credentials" href="/environments" desc="Poser les secrets de façon chiffrée (GitHub Secrets)." />
        <Step n={3} title="Lancer & suivre" href="/pipelines" desc="Déclencher validate / bootstrap / deploy et suivre l'exécution." />
      </div>

      {login && (
        <div className="card">
          <p className="text-sm text-slate-400">
            Connecté en tant que <span className="text-slate-200 font-medium">{login}</span>.
          </p>
        </div>
      )}
    </div>
  );
}

function Step({ n, title, href, desc }: { n: number; title: string; href: string; desc: string }) {
  return (
    <Link href={href} className="card hover:border-accent transition block">
      <div className="text-accent text-sm font-mono">Étape {n}</div>
      <div className="text-lg font-medium mt-1">{title}</div>
      <p className="text-sm text-slate-400 mt-1">{desc}</p>
    </Link>
  );
}
