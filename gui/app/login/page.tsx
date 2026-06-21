"use client";

import { useEffect, useState } from "react";
import { Github, Mail, KeyRound, ExternalLink, LogIn } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const GENERATE_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,workflow&description=Observability%20Console";

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
  const { t } = useI18n();
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
    if (err) setMsg(t(`err.${err}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setMsg(t("login.connected"));
    } else {
      setMsg(d.error || t("login.fail"));
    }
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setLogin(null);
    setMsg(t("login.disconnected"));
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{t("login.title")}</h1>

      {login ? (
        <div className="card space-y-3">
          <p className="text-sm">
            {t("login.connectedAs")} <span className="font-medium">{login}</span>
          </p>
          <button onClick={logout} className="btn-ghost">
            {t("login.signout")}
          </button>
        </div>
      ) : (
        <>
          {providers.length > 0 && (
            <div className="card space-y-3">
              <h2 className="text-sm font-medium text-slate-300">{t("login.providerSection")}</h2>
              {providers.map((p) => {
                const Icon = providerIcon[p.id] ?? LogIn;
                return (
                  <a key={p.id} href={`/api/auth/${p.id}/start`} className="btn w-full">
                    <Icon className="h-4 w-4" />
                    {t("login.signinWith", { label: p.label })}
                  </a>
                );
              })}
            </div>
          )}

          <div className="card space-y-3">
            <h2 className="text-sm font-medium text-slate-300">
              {providers.length > 0 ? t("login.tokenSectionAlt") : t("login.tokenSection")}
            </h2>
            <div>
              <label className="label">{t("login.tokenLabel")}</label>
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
                {t("login.generate")}
              </a>
            </div>
            <button onClick={connect} disabled={busy || !token} className="btn-ghost w-full">
              <KeyRound className="h-4 w-4" />
              {busy ? t("login.connecting") : t("login.tokenBtn")}
            </button>
            <p className="text-xs text-slate-500">{t("login.note")}</p>
          </div>
        </>
      )}

      {msg && <p className="text-sm text-slate-400">{msg}</p>}
    </div>
  );
}
