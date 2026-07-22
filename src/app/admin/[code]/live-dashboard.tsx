"use client";

import { useEffect, useState } from "react";
import type { EventStats } from "@/lib/event-stats";
import { createClient } from "@/lib/supabase/client";
import { eventChannelName } from "@/lib/realtime-channels";

// Filet de sécurité si un message Realtime est manqué (reconnexion, etc.).
const FALLBACK_POLL_INTERVAL_MS = 30000;

function formatDelay(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveDashboard({
  code,
  eventId,
  initialStats,
}: {
  code: string;
  eventId: string;
  initialStats: EventStats;
}) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch(`/api/admin/events/${code}/stats`);
        const data = await res.json();
        if (!cancelled && res.ok) setStats(data);
      } catch {
        // silencieux : le prochain signal Realtime ou le filet de secours réessaiera
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel(eventChannelName(eventId))
      .on("broadcast", { event: "activity" }, () => refresh())
      .subscribe();

    const interval = setInterval(refresh, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [code, eventId]);

  const cards = [
    { label: "Photos capturées", value: stats.photosCount },
    { label: "Invités enregistrés", value: stats.guestsCount },
    { label: "Taux de récupération", value: `${Math.round(stats.recoveryRate)}%` },
    { label: "Partages cliqués", value: stats.sharesCount },
    { label: "Délai moyen livraison", value: formatDelay(stats.avgDeliveryMs) },
  ];

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-surface p-4"
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

      <div className="mt-8">
        <h2 className="font-sans text-sm font-medium text-foreground/70">
          Activité en direct
        </h2>
        {stats.activity.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-foreground/50">
            Aucune activité pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {stats.activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b border-border py-2 font-sans text-sm text-foreground/80"
              >
                <span>{item.label}</span>
                <span className="text-foreground/50">{formatTime(item.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
