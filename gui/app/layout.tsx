import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Observability Platform — Console",
  description: "Configuration, credentials et pilotage des pipelines de la plateforme d'observabilité",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen">
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
