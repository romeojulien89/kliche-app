import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("name, event_date, location, hashtag, sponsor_name, public_gallery")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {event.sponsor_name ? (
        <p className="cascade text-xs font-medium tracking-[0.3em] text-accent uppercase">
          {event.sponsor_name}
        </p>
      ) : null}

      <h1 className="font-display mt-4 text-4xl font-bold tracking-[0.04em] text-foreground sm:text-6xl">
        {event.name}
      </h1>

      <p className="mt-3 font-sans text-sm text-foreground/60">
        {[event.event_date, event.location].filter(Boolean).join(" · ")}
        {event.hashtag ? ` · ${event.hashtag}` : ""}
      </p>

      <Link
        href={`/e/${code}/consentement`}
        className="mt-10 rounded-full bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground"
      >
        Retrouver mes photos
      </Link>

      {event.public_gallery ? (
        <Link
          href={`/e/${code}/galerie`}
          className="mt-4 font-sans text-sm text-foreground/60 underline underline-offset-2"
        >
          Parcourir la galerie sans selfie
        </Link>
      ) : null}
    </main>
  );
}
