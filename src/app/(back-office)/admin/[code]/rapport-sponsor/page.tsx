import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeEventStats } from "@/lib/event-stats";
import { BackLink } from "@/components/back-link";
import { PrintButton } from "./print-button";

function buildPitch(
  sponsorName: string | null,
  photosCount: number,
  guestsCount: number,
  sharesCount: number,
): string {
  const sponsor = sponsorName ?? "Le sponsor";
  return `${sponsor} a bénéficié d'une visibilité continue tout au long de l'événement : son cadre est apparu sur chacune des ${photosCount} photo${photosCount > 1 ? "s" : ""} livrée${photosCount > 1 ? "s" : ""} aux ${guestsCount} invité${guestsCount > 1 ? "s" : ""} enregistré${guestsCount > 1 ? "s" : ""}. Ces photos ont généré ${sharesCount} partage${sharesCount > 1 ? "s" : ""} sur WhatsApp, prolongeant la portée de la marque au-delà de la salle, dans les conversations privées des invités.`;
}

export default async function SponsorReportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, event_date, location, sponsor_name")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const stats = await computeEventStats(event.id);
  const pitch = buildPitch(
    event.sponsor_name,
    stats.photosCount,
    stats.guestsCount,
    stats.sharesCount,
  );

  const cards = [
    { label: "Photos livrées", value: stats.photosCount },
    { label: "Invités touchés", value: stats.guestsCount },
    { label: "Taux de récupération", value: `${Math.round(stats.recoveryRate)}%` },
    { label: "Partages WhatsApp", value: stats.sharesCount },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 print:py-0">
      <BackLink
        href={`/admin/${code.toUpperCase()}`}
        label="Retour à l'événement"
        className="cascade print:hidden"
      />

      <div className="mt-4 flex items-center justify-between print:mt-0">
        <div>
          <p className="font-sans text-xs tracking-[0.2em] text-accent uppercase">
            Rapport sponsor
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold text-foreground">
            {event.name}
          </h1>
          <p className="mt-1 font-sans text-sm text-foreground/60">
            {[event.event_date, event.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-surface p-4 text-center"
          >
            <p className="font-display text-2xl font-bold text-accent">
              {card.value}
            </p>
            <p className="mt-1 font-sans text-xs text-foreground/60">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-foreground">
          {event.sponsor_name ?? "Sponsor"}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/80">
          {pitch}
        </p>
      </div>

      <p className="mt-16 text-center font-sans text-xs text-foreground/40">
        Propulsé par Kliché · Rocket Corporation
      </p>
    </main>
  );
}
