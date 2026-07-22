import { NextResponse } from "next/server";
import { DeleteFacesCommand } from "@aws-sdk/client-rekognition";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRekognitionClient, collectionIdForEvent } from "@/lib/rekognition";

/**
 * Purge quotidienne (Vercel Cron, voir vercel.json) : supprime les invités dont
 * le délai de conservation (30 jours après consentement) est dépassé — leur
 * visage Rekognition et leur ligne `guests`. Les photos de l'événement restent ;
 * seul le rattachement à cet invité disparaît (photo_faces.guest_id -> null,
 * ON DELETE SET NULL).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: expiredGuests, error: selectError } = await supabase
    .from("guests")
    .select("id, event_id, selfie_face_id")
    .lte("purge_at", new Date().toISOString());

  if (selectError) {
    console.error("[cron/purge-guests] select", selectError);
    return NextResponse.json({ error: "Erreur lors de la sélection." }, { status: 500 });
  }

  if (!expiredGuests || expiredGuests.length === 0) {
    return NextResponse.json({ purged: 0 });
  }

  const rekognition = createRekognitionClient();

  for (const guest of expiredGuests) {
    if (!guest.selfie_face_id) continue;
    try {
      await rekognition.send(
        new DeleteFacesCommand({
          CollectionId: collectionIdForEvent(guest.event_id),
          FaceIds: [guest.selfie_face_id],
        }),
      );
    } catch (err) {
      console.error("[cron/purge-guests] DeleteFaces", guest.id, err);
    }
  }

  const { error: deleteError } = await supabase
    .from("guests")
    .delete()
    .in(
      "id",
      expiredGuests.map((g) => g.id),
    );

  if (deleteError) {
    console.error("[cron/purge-guests] delete", deleteError);
    return NextResponse.json({ error: "Erreur lors de la purge." }, { status: 500 });
  }

  return NextResponse.json({ purged: expiredGuests.length });
}
