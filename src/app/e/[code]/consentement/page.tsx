import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";
import { recordConsent } from "./actions";

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Avant de continuer
        </h1>
        <p className="mt-2 font-sans text-sm text-foreground/60">
          {event.name}
        </p>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <ConsentForm action={recordConsent.bind(null, code)} />
      </div>
    </main>
  );
}
