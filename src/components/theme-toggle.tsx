"use client";

import { useState } from "react";
import { applyTheme, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "clair", label: "Clair" },
  { value: "sombre", label: "Sombre" },
];

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "auto";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);

  function choose(next: ThemeMode) {
    setMode(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div
      role="group"
      aria-label="Choix du thème"
      className="fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-border bg-surface/80 p-1 shadow-sm backdrop-blur-sm"
      suppressHydrationWarning
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => choose(option.value)}
          aria-pressed={mode === option.value}
          suppressHydrationWarning
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            mode === option.value
              ? "bg-accent text-accent-foreground"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
