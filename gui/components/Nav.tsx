"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/environments", label: "Configuration" },
  { href: "/pipelines", label: "Pipelines" },
  { href: "/runs", label: "Suivi" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-edge bg-panel/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-accent">◎</span>
          <span>Observability Console</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  active ? "bg-accent text-white" : "text-slate-300 hover:bg-edge"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/login" className="ml-2 btn-ghost">
            Compte
          </Link>
        </nav>
      </div>
    </header>
  );
}
