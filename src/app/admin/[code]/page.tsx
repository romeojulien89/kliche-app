import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeEventStats } from "@/lib/event-stats";
import { LiveDashboard } from "./live-dashboard";

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, code, event_date, location, sponsor_name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const initialStats = await computeEventStats(event.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {event.name}
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground/60">
            Code invité : <span className="text-accent">{event.code}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/${event.code}/qr`}
            className="rounded-full border border-border px-4 py-2 font-sans text-sm text-foreground"
          >
            QR code
          </Link>
          <Link
            href={`/admin/${event.code}/rapport-sponsor`}
            className="rounded-full border border-border px-4 py-2 font-sans text-sm text-foreground"
          >
            Rapport sponsor
          </Link>
        </div>
      </div>

      <LiveDashboard code={event.code} initialStats={initialStats} />
    </main>
  );
}
