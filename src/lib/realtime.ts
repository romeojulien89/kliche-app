import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Diffuse un message Realtime (Broadcast, pas Postgres Changes — évite d'avoir
 * à exposer photos/guests/photo_faces via des policies RLS publiques). Non
 * bloquant par nature : les appelants doivent l'utiliser en "fire and forget"
 * (ne pas laisser une erreur de diffusion faire échouer la requête principale).
 *
 * Server-only (dépend de createAdminClient) : les noms de canaux, utilisables
 * aussi côté client pour s'abonner, vivent dans lib/realtime-channels.ts.
 */
export async function broadcast(
  channelName: string,
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const supabase = createAdminClient();
  const channel = supabase.channel(channelName);

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({ type: "broadcast", event, payload })
          .finally(() => {
            supabase.removeChannel(channel);
            resolve();
          });
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        supabase.removeChannel(channel);
        resolve();
      }
    });
  });
}
