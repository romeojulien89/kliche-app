"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guestChannelName } from "@/lib/realtime-channels";
import { PhotoGrid } from "../photo-grid";
import type { ViewerPhoto } from "../photo-viewer";

type Phase = "camera" | "analyse" | "erreur" | "galerie";

// Filet de sécurité si un message Realtime est manqué (reconnexion, etc.).
const FALLBACK_POLL_INTERVAL_MS = 60000;

export function SelfieCapture({
  guestId,
  alreadyCaptured,
  hashtag,
  hdIncluded,
}: {
  guestId: string;
  alreadyCaptured: boolean;
  hashtag: string | null;
  hdIncluded: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(alreadyCaptured ? "galerie" : "camera");
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ViewerPhoto[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (phase !== "camera") return;

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setError(
          "Impossible d'accéder à la caméra. Autorisez l'accès dans les réglages de votre navigateur.",
        );
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "galerie") return;

    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/guests/photos");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.photos)) setPhotos(data.photos);
      } catch {
        // silencieux : le prochain signal Realtime ou le filet de secours réessaiera
      }
    }

    refresh();

    const supabase = createClient();
    const channel = supabase
      .channel(guestChannelName(guestId))
      .on("broadcast", { event: "new-match" }, () => refresh())
      .subscribe();

    const interval = setInterval(refresh, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [phase, guestId]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        setPhase("analyse");
        setError(null);

        const formData = new FormData();
        formData.set("file", blob, "selfie.jpg");

        try {
          const res = await fetch("/api/guests/selfie", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (!res.ok) {
            setError(data.error ?? "Erreur lors de l'analyse du selfie.");
            setPhase("erreur");
            return;
          }

          setPhase("galerie");
        } catch {
          setError("Erreur réseau, réessayez.");
          setPhase("erreur");
        }
      },
      "image/jpeg",
      0.9,
    );
  }

  if (phase === "camera" || phase === "erreur") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Votre selfie
        </h1>
        <p className="mt-2 max-w-xs font-sans text-sm text-foreground/60">
          Bonne lumière, visage dégagé, souriez.
        </p>

        <div className="relative mt-8 h-80 w-60">
          <div className="halo-pulse absolute inset-0 rounded-full border-2 border-accent" />
          <div className="absolute inset-2 overflow-hidden rounded-full bg-surface">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full -scale-x-100 object-cover"
            />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error ? (
          <p className="mt-4 max-w-xs font-sans text-sm text-red-500">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={capture}
          className="mt-8 rounded-full bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground"
        >
          {error ? "Réessayer" : "Prendre le selfie"}
        </button>
      </main>
    );
  }

  if (phase === "analyse") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Recherche en cours…
        </h1>
        <p className="mt-2 font-sans text-sm text-foreground/60">
          Nous recherchons vos photos.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-16">
      <h1 className="font-display text-center text-2xl font-bold text-foreground sm:text-3xl">
        Vos photos
      </h1>
      <p className="mt-2 text-center font-sans text-sm text-foreground/60">
        {photos.length === 0
          ? "Aucune photo pour l'instant — revenez bientôt."
          : `${photos.length} photo${photos.length > 1 ? "s" : ""} trouvée${photos.length > 1 ? "s" : ""}.`}
      </p>

      {photos.length > 0 ? (
        <div className="mx-auto mt-8 max-w-md">
          <PhotoGrid
            photos={photos}
            hashtag={hashtag}
            hdIncluded={hdIncluded}
            columnsClassName="grid-cols-2"
          />
        </div>
      ) : null}
    </main>
  );
}
