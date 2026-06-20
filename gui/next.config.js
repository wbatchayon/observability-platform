/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Paquets serveur chargés nativement par Node (routes API) au lieu d'être bundlés par webpack.
    serverComponentsExternalPackages: ["@octokit/rest", "tweetsodium"],
  },
};

module.exports = nextConfig;
