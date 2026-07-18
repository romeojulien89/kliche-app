"use client";

import { useState } from "react";
import Image from "next/image";

export type ViewerPhoto = { id: string; url: string };

export function PhotoViewer({
  photo,
  hashtag,
  hdIncluded,
  onClose,
}: {
  photo: ViewerPhoto;
  hashtag: string | null;
  hdIncluded: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  function shareUrl() {
    return photo.url;
  }

  async function handleShare() {
    fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_id: photo.id }),
    }).catch(() => {});

    const text = `Ma photo${hashtag ? ` ${hashtag}` : ""} 📸 ${shareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silencieux
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      if (hdIncluded) {
        const res = await fetch(`/api/photos/${photo.id}/hd-url`);
        const data = await res.json();
        if (res.ok && data.url) {
          window.open(data.url, "_blank");
          return;
        }
      }
      window.open(photo.url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4 py-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 font-sans text-2xl text-white/80"
      >
        ×
      </button>

      <div
        className="relative w-full max-w-lg"
        style={{ aspectRatio: "3 / 4" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={photo.url} alt="" fill sizes="100vw" className="rounded-md object-contain" />
      </div>

      <div
        className="mt-6 flex w-full max-w-lg flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!hdIncluded ? (
          <p className="text-center font-sans text-xs text-white/50">
            HD bientôt disponible — téléchargement en qualité aperçu pour l&apos;instant.
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-full bg-accent px-4 py-3 font-sans text-sm font-medium text-accent-foreground"
          >
            Partager sur WhatsApp
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 rounded-full border border-white/30 px-4 py-3 font-sans text-sm font-medium text-white disabled:opacity-50"
          >
            {downloading ? "…" : "Télécharger"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="font-sans text-sm text-white/70 underline underline-offset-2"
        >
          {copied ? "Lien copié !" : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}
