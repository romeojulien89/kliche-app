// Utilisable côté client ET serveur (pas de "server-only" ici) — juste les
// conventions de nommage des canaux, partagées par lib/realtime.ts (serveur,
// diffusion) et les composants client (abonnement).

export function guestChannelName(guestId: string): string {
  return `guest-${guestId}`;
}

export function eventChannelName(eventId: string): string {
  return `event-${eventId}`;
}
