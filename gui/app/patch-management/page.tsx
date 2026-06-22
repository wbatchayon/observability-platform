"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpCircle, Loader2, PackageCheck, RefreshCw } from "lucide-react";

type Component = { key: string; label: string; namespace: string; current: string };

export default function PatchManagementPage() {
  const [environment, setEnvironment] = useState("dev");
  const [components, setComponents] = useState<Component[]>([]);
  const [next, setNext] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    const r = await fetch(`/api/patch-management?environment=${environment}`);
    const d = await r.json();
    setLoading(false);
    if (r.ok) {
      setComponents(d.components);
      setNext(Object.fromEntries(d.components.map((c: Component) => [c.key, c.current])));
    } else {
      setMsg(`❌ ${d.error || "Lecture impossible"}`);
    }
  }, [environment]);

  useEffect(() => {
    load();
  }, [load]);

  // Ne soumet que les versions réellement modifiées.
  const changed = components.filter((c) => next[c.key] && next[c.key] !== c.current);

  async function launch() {
    if (changed.length === 0) return;
    setBusy(true);
    setMsg(null);
    const versions = Object.fromEntries(changed.map((c) => [c.key, next[c.key]]));
    const r = await fetch("/api/patch-management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment, versions, launch: true }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) {
      setMsg(
        `✅ PR de montée de version créée : ${d.prUrl}` +
          (d.dispatched ? " — déploiement déclenché." : " — à merger pour déployer."),
      );
    } else {
      setMsg(`❌ ${d.error || "Échec"}${d.issues ? " : " + JSON.stringify(d.issues) : ""}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patch management</h1>
        <p className="mt-1 text-slate-400">
          Montée de version des composants : saisissez le numéro de version stable voulu puis lancez.
          La mise à jour passe par une Pull Request (GitOps) puis le déploiement Flux.
        </p>
      </div>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-auto">
          <label className="label">Environnement</label>
          <select
            className="input"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          >
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="prod">prod</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Rafraîchir
        </button>
        <p className="text-xs text-slate-500 sm:self-end sm:pb-2">
          Astuce : Renovate ouvre des PR proposant les dernières versions stables.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-slate-400">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-4 font-medium">Composant</th>
              <th className="py-2 pr-4 font-medium">Namespace</th>
              <th className="py-2 pr-4 font-medium">Version actuelle</th>
              <th className="py-2 pr-4 font-medium">Nouvelle version</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => {
              const isChanged = next[c.key] && next[c.key] !== c.current;
              return (
                <tr key={c.key} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-medium text-white">
                    <span className="inline-flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-accent" />
                      {c.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{c.namespace}</td>
                  <td className="py-2 pr-4 font-mono text-slate-300">{c.current || "—"}</td>
                  <td className="py-2 pr-4">
                    <input
                      className={`input font-mono ${isChanged ? "border-accent" : ""}`}
                      value={next[c.key] ?? ""}
                      onChange={(e) => setNext({ ...next, [c.key]: e.target.value })}
                      placeholder="ex. 6.7.0"
                    />
                  </td>
                </tr>
              );
            })}
            {components.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  Aucun composant chargé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={launch} disabled={busy || changed.length === 0} className="btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
          Lancer la mise à jour
          {changed.length > 0 ? ` (${changed.length})` : ""}
        </button>
        <Link href="/runs" className="btn-ghost">
          Voir les exécutions
        </Link>
      </div>

      {msg && <p className="text-sm break-all">{msg}</p>}
    </div>
  );
}
