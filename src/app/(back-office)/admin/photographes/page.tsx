import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/back-link";
import { AddPhotographerForm } from "./add-photographer-form";

export default async function PhotographesPage() {
  const supabase = createAdminClient();
  const { data: photographers } = await supabase
    .from("photographers")
    .select("id, name, email")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <BackLink href="/admin" label="Événements" className="cascade self-start" />
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
        Photographes
      </h1>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        Ajoute un compte photographe pour donner accès à /studio.
      </p>
      <AddPhotographerForm />

      {photographers && photographers.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-2">
          {photographers.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 font-sans text-sm text-foreground"
            >
              <span>{p.name}</span>
              <span className="text-foreground/50">{p.email}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
