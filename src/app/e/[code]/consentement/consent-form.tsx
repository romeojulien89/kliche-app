"use client";

import { useState } from "react";

export function ConsentForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-6 text-left">
      <p className="font-sans text-sm text-foreground/70">
        Votre selfie sert uniquement à retrouver vos photos de cet événement.
        Il est supprimé automatiquement sous 30 jours, conformément à la
        réglementation ivoirienne (ARTCI).
      </p>

      <label className="flex items-start gap-3 font-sans text-sm text-foreground">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 accent-accent"
        />
        <span>
          J&apos;accepte l&apos;utilisation de mon selfie dans les conditions
          décrites ci-dessus.
        </span>
      </label>

      <button
        type="submit"
        disabled={!checked}
        className="rounded-full bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuer
      </button>
    </form>
  );
}
