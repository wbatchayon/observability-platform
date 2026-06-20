"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, Github } from "lucide-react";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/environments", label: "Configuration" },
  { href: "/pipelines", label: "Pipelines" },
  { href: "/runs", label: "Suivi" },
  { href: "/tools", label: "Outils" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Hexagon className="h-5 w-5 text-accent" strokeWidth={2.2} />
          <span>Observability Console</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-accent/90 text-white shadow-[0_6px_20px_-8px_rgba(59,130,246,0.8)]"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/login" className="btn-ghost ml-2">
            <Github className="h-4 w-4" />
            Compte
          </Link>
        </nav>
      </div>
    </header>
  );
}
