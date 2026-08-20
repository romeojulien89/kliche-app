import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateEventForm } from "./create-event-form";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, code")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Nouvel événement
        </h1>
        <Link
          href="/admin/photographes"
          className="font-sans text-sm text-accent underline underline-offset-2"
        >
          Photographes
        </Link>
      </div>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        Espace organisateur.
      </p>
      <CreateEventForm />

      {events && events.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-sans text-sm font-medium text-foreground/70">
            Événements
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {events.map((event, i) => (
              <li
                key={event.id}
                style={{ animationDelay: `${i * 0.08}s` }}
                className="cascade rounded-md border border-border bg-surface px-4 py-3 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between font-sans text-sm text-foreground">
                  <span>{event.name}</span>
                  <span className="text-accent">{event.code}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/${event.code}`}
                    className="rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href={`/admin/photos?event=${event.code}`}
                    className="rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    Photos
                  </Link>
                  <Link
                    href="/studio"
                    className="rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    Studio
                  </Link>
                  <Link
                    href={`/e/${event.code}`}
                    className="rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    Selfie
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
