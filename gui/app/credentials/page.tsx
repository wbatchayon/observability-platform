"use client";

import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { credentialGroups } from "@/lib/validation";
import { useI18n } from "@/lib/i18n";

export default function CredentialsPage() {
  const { t } = useI18n();
  const [environment, setEnvironment] = useState("dev");
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function save() {
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v && v.trim()));
    if (Object.keys(filled).length === 0) {
      setMsg(`❌ ${t("cred.empty")}`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment, ...filled }),
      });
      const d = await r.json();
      if (r.ok) {
        setValues({});
        setMsg(`✅ ${t("cred.saved", { n: String(d.secretsSet.length), env: environment })}`);
      } else {
        setMsg(`❌ ${d.error || t("pipe.fail")}`);
      }
    } catch {
      setMsg(`❌ ${t("pipe.fail")}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("cred.title")}</h1>
        <p className="mt-1 text-slate-400">{t("cred.subtitle")}</p>
      </div>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="label">{t("common.environment")}</label>
          <select className="input" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-slate-500 sm:self-end sm:pb-2">
          <ShieldCheck className="h-4 w-4 text-ok" />
          {t("cred.hint")}
        </p>
      </div>

      {credentialGroups.map((g) => (
        <section key={g.id} className="card space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-medium">{t(`cred.group.${g.id}`)}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.multiline ? "sm:col-span-2" : ""}>
                <label className="label">
                  {f.label} <span className="font-mono text-xs text-slate-500">({f.key})</span>
                </label>
                {f.multiline ? (
                  <textarea
                    className="input font-mono"
                    rows={4}
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    value={values[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy} className="btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {t("cred.save")}
        </button>
      </div>

      {msg && <p className="text-sm break-words">{msg}</p>}
    </div>
  );
}
