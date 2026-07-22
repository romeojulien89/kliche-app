"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "4rem 1.5rem" }}>
        <h1>Une erreur est survenue</h1>
        <p>Réessayez dans un instant. L&apos;équipe a été notifiée.</p>
      </body>
    </html>
  );
}
