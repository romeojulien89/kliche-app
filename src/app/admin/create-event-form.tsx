"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "./actions";

const initialState: CreateEventState = {};

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(
    createEvent,
    initialState,
  );

  if (state.code) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="font-sans text-sm text-foreground/70">
          Événement créé. Code invité :
        </p>
        <p className="font-display mt-2 text-3xl font-bold tracking-widest text-accent">
          {state.code}
        </p>
        <p className="mt-4 font-sans text-sm text-foreground/70">
          Page invité :{" "}
          <a
            href={`/e/${state.code}`}
            className="text-accent underline underline-offset-2"
          >
            /e/{state.code}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <label className="flex flex-col gap-1 font-sans text-sm">
        Nom de l&apos;événement *
        <input
          name="name"
          required
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Date
        <input
          type="date"
          name="event_date"
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Lieu
        <input
          name="location"
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Hashtag
        <input
          name="hashtag"
          placeholder="#monevenement"
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Sponsor
        <input
          name="sponsor_name"
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex items-center gap-2 font-sans text-sm">
        <input type="checkbox" name="hd_included" className="accent-accent" />
        HD incluse
      </label>

      <label className="flex items-center gap-2 font-sans text-sm">
        <input
          type="checkbox"
          name="public_gallery"
          className="accent-accent"
        />
        Galerie publique
      </label>

      {state.error ? (
        <p className="font-sans text-sm text-red-500">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-50"
      >
        {pending ? "Création…" : "Créer l'événement"}
      </button>
    </form>
  );
}
