"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-1 font-sans text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Mot de passe
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
