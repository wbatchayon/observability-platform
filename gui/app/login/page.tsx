"use client";

import { useEffect, useState } from "react";
import { Github, Mail, KeyRound, ExternalLink, LogIn } from "lucide-react";

const GENERATE_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Observability%20Console";

const errorMessages: Record<string, string> = {
  state: "Échec de vérification de sécurité (state). Réessayez.",
  token: "Échec de l'échange OAuth. Réessayez.",
  forbidden: "Accès refusé : identité non autorisée (email/domaine ou accès au dépôt).",
  provider_disabled: "Ce fournisseur de connexion n'est pas configuré sur ce serveur.",
};

interface ProviderInfo {
  id: "github" | "google" | "oidc";
  label: string;
}

const providerIcon: Record<string, typeof Github> = {
  github: Github,
  google: Mail,
  oidc: LogIn,
};

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [login, setLogin] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setLogin(d.login);
        setProviders(d.providers || []);
      })
      .catch(() => {});
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setMsg(errorMessages[err] || "Échec de connexion.");
  }, []);

  async function connect() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) {
      setLogin(d.login);
      setToken("");
      setMsg("Connecté.");
    } else {
      setMsg(d.error || "Échec de connexion.");
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setLogin(null);
    setMsg("Déconnecté.");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Connexion</h1>

      {login ? (
        <div className="card space-y-3">
          <p className="text-sm">
            Connecté : <span className="font-medium">{login}</span>
          </p>
          <button onClick={logout} className="btn-ghost">
            Se déconnecter
          </button>
        </div>
      ) : (
        <>
          {providers.length > 0 && (
            <div className="card space-y-3">
              <h2 className="text-sm font-medium text-slate-300">Connexion avec un fournisseur</h2>
              {providers.map((p) => {
                const Icon = providerIcon[p.id] ?? LogIn;
                return (
                  <a key={p.id} href={`/api/auth/${p.id}/start`} className="btn w-full">
                    <Icon className="h-4 w-4" />
                    Se connecter avec {p.label}
                  </a>
                );
              })}
            </div>
          )}

          <div className="card space-y-3">
            <h2 className="text-sm font-medium text-slate-300">
              {providers.length > 0 ? "Ou par jeton GitHub" : "Connexion par jeton GitHub"}
            </h2>
            <div>
              <label className="label">Jeton GitHub (portées repo et workflow)</label>
              <input
                type="password"
                className="input"
                placeholder="ghp_…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <a
                href={GENERATE_TOKEN_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Générer un jeton (portées pré-remplies)
              </a>
            </div>
            <button onClick={connect} disabled={busy || !token} className="btn-ghost w-full">
              <KeyRound className="h-4 w-4" />
              {busy ? "Connexion…" : "Se connecter avec un jeton"}
            </button>
            <p className="text-xs text-slate-500">
              Accès réservé aux identités autorisées (email/domaine pour Google/SSO, accès en
              écriture au dépôt pour GitHub). Aucune donnée sensible n&apos;est stockée côté serveur.
            </p>
          </div>
        </>
      )}

      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </div>
  );
}
