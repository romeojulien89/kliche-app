"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getServerThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from "@/lib/theme";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "clair", label: "Clair" },
  { value: "sombre", label: "Sombre" },
];

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribeThemeMode, getStoredThemeMode, getServerThemeMode);

  function choose(next: ThemeMode) {
    setStoredThemeMode(next);
    applyTheme(next);
  }

  return (
    <div
      role="group"
      aria-label="Choix du thème"
      className="fixed top-4 right-4 z-50 flex items-center gap-0.5 rounded-full border border-border bg-surface/80 p-1 shadow-sm backdrop-blur-sm print:hidden"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => choose(option.value)}
          aria-pressed={mode === option.value}
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
