import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp (traitement d'image, lib/watermark.ts) est un module natif : sans ça,
  // le bundler peut l'empaqueter incorrectement pour l'environnement serverless
  // Vercel — fonctionne en local (node_modules direct) mais casse la route
  // entière (crash au chargement du module, avant toute exécution du handler).
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xzuwdvrwjfmrthivjmee.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
