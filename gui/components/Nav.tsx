"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Hexagon, Github, Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/environments", label: "Configuration" },
  { href: "/pipelines", label: "Pipelines" },
  { href: "/runs", label: "Suivi" },
  { href: "/tools", label: "Outils" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
          <Hexagon className="h-5 w-5 text-accent" strokeWidth={2.2} />
          <span className="text-sm sm:text-base">Observability Console</span>
        </Link>

        {/* Navigation bureau */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                isActive(l.href)
                  ? "bg-accent/90 text-white shadow-[0_6px_20px_-8px_rgba(59,130,246,0.8)]"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="btn-ghost ml-2">
            <Github className="h-4 w-4" />
            Compte
          </Link>
        </nav>

        {/* Bouton menu mobile */}
        <button
          aria-label="Menu"
          className="btn-ghost md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu déroulant mobile */}
      {open && (
        <nav className="border-t border-white/10 bg-black/60 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  isActive(l.href) ? "bg-accent/90 text-white" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            >
              <Github className="h-4 w-4" />
              Compte
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
