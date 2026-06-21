import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Observability Platform Console",
  description:
    "Configuration, identifiants et pilotage des pipelines de la plateforme d'observabilité.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          <div className="min-h-screen">
            <Nav />
            <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
