import { NextResponse, after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { randomUUID } from "crypto";
import { IndexFacesCommand, SearchFacesCommand } from "@aws-sdk/client-rekognition";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { processPhoto } from "@/lib/watermark";
import {
  createRekognitionClient,
  collectionIdForEvent,
  externalIdForPhoto,
  guestIdFromExternalId,
} from "@/lib/rekognition";
import { broadcast } from "@/lib/realtime";
import { eventChannelName, guestChannelName } from "@/lib/realtime-channels";

// Laisse le temps à l'indexation faciale en arrière-plan (after()) de se terminer.
export const maxDuration = 60;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function indexAndMatchFaces(
  supabase: SupabaseAdmin,
  eventId: string,
  photoId: string,
  hdImage: Buffer,
) {
  const rekognition = createRekognitionClient();
  const collectionId = collectionIdForEvent(eventId);

  const indexResult = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: collectionId,
      // Copie défensive : le buffer produit par sharp peut être soutenu par un
      // SharedArrayBuffer en environnement Vercel, que le SDK AWS rejette
      // ("input argument must be ArrayBuffer"). Uint8Array.from() force une
      // copie sur un ArrayBuffer standard.
      Image: { Bytes: Uint8Array.from(hdImage) },
      ExternalImageId: externalIdForPhoto(photoId),
      MaxFaces: 15,
      QualityFilter: "AUTO",
    }),
  );

  const faceIds = (indexResult.FaceRecords ?? [])
    .map((record) => record.Face?.FaceId)
    .filter((id): id is string => !!id);

  if (faceIds.length === 0) return;

  await supabase
    .from("photo_faces")
    .insert(faceIds.map((faceId) => ({ photo_id: photoId, face_id: faceId })));

  // Rattachement automatique aux invités déjà enregistrés (selfie déjà indexé côté guest-*)
  for (const faceId of faceIds) {
    const search = await rekognition.send(
      new SearchFacesCommand({
        CollectionId: collectionId,
        FaceId: faceId,
        FaceMatchThreshold: 85,
        MaxFaces: 5,
      }),
    );

    const guestMatch = (search.FaceMatches ?? [])
      .map((m) => ({
        guestId: guestIdFromExternalId(m.Face?.ExternalImageId ?? ""),
        similarity: m.Similarity,
      }))
      .find((m) => m.guestId);

    if (guestMatch?.guestId) {
      await supabase
        .from("photo_faces")
        .update({ guest_id: guestMatch.guestId, similarity: guestMatch.similarity })
        .eq("face_id", faceId);

      await broadcast(guestChannelName(guestMatch.guestId), "new-match").catch(() => {});
    }
  }
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("[photos/upload] formData parse", {
      contentType: request.headers.get("content-type"),
      contentLength: request.headers.get("content-length"),
      err,
    });
    Sentry.captureException(err, {
      tags: { route: "photos/upload", stage: "formData" },
    });
    await Sentry.flush(2000);
    return NextResponse.json(
      { error: "Fichier illisible par le serveur, réessayez." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const eventId = String(formData.get("event_id") ?? "");

  if (!(file instanceof File) || !eventId) {
    return NextResponse.json(
      { error: "Fichier ou événement manquant." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, sponsor_name")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  let photographerId: string | null = null;
  if (user) {
    const { data: photographer } = await supabase
      .from("photographers")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    photographerId = photographer?.id ?? null;
  }

  const { data: photoRow, error: insertError } = await supabase
    .from("photos")
    .insert({ event_id: event.id, photographer_id: photographerId, status: "processing" })
    .select("id")
    .single();

  if (insertError || !photoRow) {
    return NextResponse.json(
      { error: "Erreur lors de la création de la photo." },
      { status: 500 },
    );
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const { hd, preview } = await processPhoto(input, event.sponsor_name);

    const baseName = `${event.id}/${photoRow.id}-${randomUUID()}`;
    const hdPath = `${baseName}.jpg`;
    const previewPath = `${baseName}.jpg`;

    // Un Buffer Node.js passé tel quel comme corps de requête n'est pas fiable en
    // environnement serverless (corruption binaire constatée sur Vercel) — un Blob
    // explicite force storage-js sur un chemin d'upload multipart, plus robuste.
    const hdBlob = new Blob([new Uint8Array(hd)], { type: "image/jpeg" });
    const previewBlob = new Blob([new Uint8Array(preview)], { type: "image/jpeg" });

    const [hdUpload, previewUpload] = await Promise.all([
      supabase.storage
        .from("photos-hd")
        .upload(hdPath, hdBlob, { contentType: "image/jpeg" }),
      supabase.storage
        .from("photos-preview")
        .upload(previewPath, previewBlob, { contentType: "image/jpeg" }),
    ]);

    if (hdUpload.error || previewUpload.error) {
      throw hdUpload.error ?? previewUpload.error;
    }

    await supabase
      .from("photos")
      .update({
        storage_path_hd: hdPath,
        storage_path_preview: previewPath,
        status: "ready",
      })
      .eq("id", photoRow.id);

    // Indexation faciale différée : la réponse part dès que la photo est stockée,
    // Rekognition (IndexFaces + rattachement invités) continue après coup sans
    // bloquer le photographe sur /studio. Les diffusions Realtime (fire-and-forget)
    // doivent aussi passer par after() : Vercel ne garantit leur exécution que via
    // waitUntil, jamais après le retour de la réponse HTTP.
    after(async () => {
      await broadcast(eventChannelName(event.id), "activity").catch(() => {});
      try {
        await indexAndMatchFaces(supabase, event.id, photoRow.id, hd);
      } catch (err) {
        console.error("[photos/upload] indexAndMatchFaces", err);
        Sentry.captureException(err, {
          tags: { route: "photos/upload", stage: "indexAndMatchFaces" },
          extra: { eventId: event.id, photoId: photoRow.id },
        });
        await Sentry.flush(2000);
      }
    });

    const {
      data: { publicUrl },
    } = supabase.storage.from("photos-preview").getPublicUrl(previewPath);

    return NextResponse.json({ id: photoRow.id, previewUrl: publicUrl });
  } catch (err) {
    console.error("[photos/upload]", err);
    Sentry.captureException(err, {
      tags: { route: "photos/upload", stage: "processing" },
      extra: { eventId: event.id, photoId: photoRow.id },
    });
    await Sentry.flush(2000);
    await supabase
      .from("photos")
      .update({ status: "error" })
      .eq("id", photoRow.id);

    return NextResponse.json(
      { error: "Erreur lors du traitement de la photo." },
      { status: 500 },
    );
  }
}
