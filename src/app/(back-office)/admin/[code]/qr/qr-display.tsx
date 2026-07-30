"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

function guestUrlFor(code: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/e/${code}`;
}

export function QrDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url] = useState(() => guestUrlFor(code));

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 320,
        margin: 2,
        color: { dark: "#241A12", light: "#FFFDF8" },
      });
    }
  }, [url]);

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 2000,
      margin: 3,
      color: { dark: "#241A12", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `kliche-qr-${code}.png`;
    a.click();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
        {code}
      </h1>
      <p className="mt-2 font-sans text-sm text-foreground/60">{url}</p>

      <div className="mt-8 rounded-lg bg-white p-6">
        <canvas ref={canvasRef} />
      </div>

      <button
        type="button"
        onClick={downloadPng}
        className="mt-8 rounded-full bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground"
      >
        Télécharger en PNG (haute résolution)
      </button>
    </main>
  );
}
