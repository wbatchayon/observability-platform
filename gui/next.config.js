/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone pour l'image Docker/air-gap ; sur Vercel, on laisse l'adaptateur natif.
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Paquets serveur chargés nativement par Node (routes API) au lieu d'être bundlés par webpack.
    serverComponentsExternalPackages: ["@octokit/rest", "tweetsodium"],
  },
};

module.exports = nextConfig;
