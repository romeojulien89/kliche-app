import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { IndexFacesCommand, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createRekognitionClient,
  collectionIdForEvent,
  externalIdForGuest,
  photoIdFromExternalId,
} from "@/lib/rekognition";
import { broadcast } from "@/lib/realtime";
import { eventChannelName } from "@/lib/realtime-channels";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("kliche_guest_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Session invité introuvable." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: guest } = await supabase
    .from("guests")
    .select("id, event_id")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!guest) {
    return NextResponse.json({ error: "Session invité introuvable." }, { status: 401 });
  }

  const rekognition = createRekognitionClient();
  const collectionId = collectionIdForEvent(guest.event_id);
  const bytes = Uint8Array.from(Buffer.from(await file.arrayBuffer()));

  let indexResult;
  try {
    indexResult = await rekognition.send(
      new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: bytes },
        ExternalImageId: externalIdForGuest(guest.id),
        MaxFaces: 1,
        QualityFilter: "AUTO",
      }),
    );
  } catch (err) {
    console.error("[guests/selfie] IndexFaces", err);
    Sentry.captureException(err, {
      tags: { route: "guests/selfie", stage: "IndexFaces" },
      extra: { guestId: guest.id },
    });
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du selfie, réessayez." },
      { status: 500 },
    );
  }

  if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
    return NextResponse.json(
      { error: "Aucun visage net détecté. Rapprochez-vous et réessayez." },
      { status: 422 },
    );
  }

  const faceId = indexResult.FaceRecords[0].Face?.FaceId;
  if (faceId) {
    await supabase.from("guests").update({ selfie_face_id: faceId }).eq("id", guest.id);
  }

  try {
    const search = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: bytes },
        FaceMatchThreshold: 85,
        MaxFaces: 50,
      }),
    );

    for (const match of search.FaceMatches ?? []) {
      const photoId = photoIdFromExternalId(match.Face?.ExternalImageId ?? "");
      if (!photoId || !match.Face?.FaceId) continue;

      await supabase
        .from("photo_faces")
        .update({ guest_id: guest.id, similarity: match.Similarity })
        .eq("face_id", match.Face.FaceId);
    }
  } catch (err) {
    console.error("[guests/selfie] SearchFacesByImage", err);
    Sentry.captureException(err, {
      tags: { route: "guests/selfie", stage: "SearchFacesByImage" },
      extra: { guestId: guest.id },
    });
  }

  await broadcast(eventChannelName(guest.event_id), "activity").catch(() => {});

  return NextResponse.json({ ok: true });
}
