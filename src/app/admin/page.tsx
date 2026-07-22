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
          <ul className="mt-3 flex flex-col gap-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/${event.code}`}
                  className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 font-sans text-sm text-foreground"
                >
                  <span>{event.name}</span>
                  <span className="text-accent">{event.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
