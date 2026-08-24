import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp (traitement d'image, lib/watermark.ts) est un module natif : sans ça,
  // le bundler peut l'empaqueter incorrectement pour l'environnement serverless
  // Vercel — fonctionne en local (node_modules direct) mais casse la route
  // entière (crash au chargement du module, avant toute exécution du handler).
  serverExternalPackages: ["sharp"],
  // serverExternalPackages seul n'a pas suffi : le binaire natif @img/sharp-*
  // (chargé via dlopen au runtime, invisible pour le traçage statique de
  // Turbopack) n'était pas copié dans le bundle serverless de Vercel
  // ("libvips-cpp.so introuvable" en prod uniquement). Force son inclusion.
  outputFileTracingIncludes: {
    "/api/photos/upload": ["./node_modules/@img/**/*", "./node_modules/sharp/**/*"],
    "/api/debug-upload-deps": ["./node_modules/@img/**/*", "./node_modules/sharp/**/*"],
  },
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
