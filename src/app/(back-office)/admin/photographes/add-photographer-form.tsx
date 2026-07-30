"use client";

import { useActionState } from "react";
import { addPhotographer, type AddPhotographerState } from "./actions";

const initialState: AddPhotographerState = {};

export function AddPhotographerForm() {
  const [state, formAction, pending] = useActionState(addPhotographer, initialState);

  if (state.created) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="font-sans text-sm text-foreground/70">
          Photographe créé. Transmets-lui ces identifiants (ils ne seront plus
          affichés ensuite) :
        </p>
        <p className="mt-3 font-sans text-sm text-foreground">
          Email : <span className="text-accent">{state.created.email}</span>
        </p>
        <p className="mt-1 font-sans text-sm text-foreground">
          Mot de passe :{" "}
          <span className="text-accent">{state.created.password}</span>
        </p>
        <p className="mt-3 font-sans text-xs text-foreground/50">
          Connexion sur /login. Le mot de passe peut être changé plus tard.
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
        Nom
        <input
          name="name"
          required
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      {state.error ? (
        <p className="font-sans text-sm text-red-500">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-5 py-2.5 font-sans text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Création…" : "Ajouter le photographe"}
      </button>
    </form>
  );
}
