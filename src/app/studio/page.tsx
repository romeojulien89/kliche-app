import { createClient } from "@/lib/supabase/server";
import { UploadStudio } from "./upload-studio";

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, code")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-24">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Studio photographe
      </h1>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        Espace photographe — non protégé pour l&apos;instant.
      </p>
      <UploadStudio events={events ?? []} />
    </main>
  );
}
