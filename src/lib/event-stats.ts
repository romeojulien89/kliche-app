import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type ActivityItem = {
  id: string;
  label: string;
  at: string;
};

export type EventStats = {
  photosCount: number;
  guestsCount: number;
  recoveryRate: number; // 0-100
  sharesCount: number;
  avgDeliveryMs: number | null;
  activity: ActivityItem[];
};

export async function computeEventStats(eventId: string): Promise<EventStats> {
  const supabase = createAdminClient();

  const [{ data: photos }, { data: guests }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, created_at")
      .eq("event_id", eventId),
    supabase
      .from("guests")
      .select("id, consent_at")
      .eq("event_id", eventId),
  ]);

  const photoIds = (photos ?? []).map((p) => p.id);
  const photoCreatedAt = new Map((photos ?? []).map((p) => [p.id, p.created_at]));

  const [{ data: faces }, { data: shares }] = await Promise.all([
    photoIds.length > 0
      ? supabase
          .from("photo_faces")
          .select("photo_id, guest_id, created_at")
          .in("photo_id", photoIds)
          .not("guest_id", "is", null)
      : Promise.resolve({ data: [] as { photo_id: string; guest_id: string; created_at: string }[] }),
    photoIds.length > 0
      ? supabase.from("shares").select("id, created_at").in("photo_id", photoIds)
      : Promise.resolve({ data: [] as { id: string; created_at: string }[] }),
  ]);

  const matchedGuestIds = new Set((faces ?? []).map((f) => f.guest_id));
  const guestsCount = guests?.length ?? 0;
  const recoveryRate = guestsCount > 0 ? (matchedGuestIds.size / guestsCount) * 100 : 0;

  const delays = (faces ?? [])
    .map((f) => {
      const uploadedAt = photoCreatedAt.get(f.photo_id);
      if (!uploadedAt) return null;
      return new Date(f.created_at).getTime() - new Date(uploadedAt).getTime();
    })
    .filter((d): d is number => d !== null && d >= 0);

  const avgDeliveryMs =
    delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : null;

  const activity: ActivityItem[] = [
    ...(photos ?? []).map((p) => ({
      id: `photo-${p.id}`,
      label: "Nouvelle photo ajoutée",
      at: p.created_at,
    })),
    ...(guests ?? [])
      .filter((g) => g.consent_at)
      .map((g) => ({
        id: `guest-${g.id}`,
        label: "Nouvel invité inscrit",
        at: g.consent_at as string,
      })),
    ...(shares ?? []).map((s) => ({
      id: `share-${s.id}`,
      label: "Photo partagée sur WhatsApp",
      at: s.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return {
    photosCount: photoIds.length,
    guestsCount,
    recoveryRate,
    sharesCount: shares?.length ?? 0,
    avgDeliveryMs,
    activity,
  };
}
