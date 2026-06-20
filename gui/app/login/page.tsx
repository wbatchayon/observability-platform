"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [login, setLogin] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => setLogin(d.login)).catch(() => {});
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
      setMsg(d.error || "Échec de connexion");
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setLogin(null);
    setMsg("Déconnecté.");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Compte</h1>
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
        <div className="card space-y-3">
          <div>
            <label className="label">Jeton GitHub (portées repo et workflow)</label>
            <input
              type="password"
              className="input"
              placeholder="ghp_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Accès réservé aux utilisateurs disposant d&apos;un accès en écriture au dépôt. Le jeton
              reste dans une session chiffrée (cookie httpOnly) et n&apos;est jamais stocké côté
              serveur.
            </p>
          </div>
          <button onClick={connect} disabled={busy || !token} className="btn">
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </div>
  );
}
