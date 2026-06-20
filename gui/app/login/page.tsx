"use client";

import { useEffect, useState } from "react";
import { Github, KeyRound, ExternalLink } from "lucide-react";

const GENERATE_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Observability%20Console";

const errors: Record<string, string> = {
  state: "Échec de vérification de sécurité (state). Réessayez.",
  token: "Impossible d'obtenir un jeton GitHub. Réessayez.",
  forbidden: "Accès refusé : un accès en écriture au dépôt est requis.",
  oauth_disabled: "La connexion GitHub n'est pas configurée sur ce serveur.",
};

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [login, setLogin] = useState<string | null>(null);
  const [oauth, setOauth] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setLogin(d.login);
        setOauth(!!d.oauthEnabled);
      })
      .catch(() => {});
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setMsg(errors[err] || "Échec de connexion.");
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
          {/* Méthode recommandée : OAuth GitHub (aucun jeton à saisir) */}
          <div className="card space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Recommandé</h2>
            <a
              href="/api/auth/oauth/start"
              className={`btn w-full ${oauth ? "" : "pointer-events-none opacity-40"}`}
            >
              <Github className="h-4 w-4" />
              Se connecter avec GitHub
            </a>
            {!oauth && (
              <p className="text-xs text-slate-500">
                Connexion GitHub non configurée sur ce serveur. Utilisez un jeton ci-dessous, ou
                configurez une OAuth App (voir documentation).
              </p>
            )}
          </div>

          {/* Méthode alternative : jeton personnel */}
          <div className="card space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Par jeton personnel</h2>
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
              Accès réservé aux utilisateurs disposant d&apos;un accès en écriture au dépôt. Le jeton
              reste dans une session chiffrée (cookie httpOnly) et n&apos;est jamais stocké côté
              serveur.
            </p>
          </div>
        </>
      )}

      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </div>
  );
}
