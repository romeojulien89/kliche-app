"use server";

import { CreateCollectionCommand } from "@aws-sdk/client-rekognition";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEventCode } from "@/lib/event-code";
import { createRekognitionClient, collectionIdForEvent } from "@/lib/rekognition";

export type CreateEventState = {
  error?: string;
  code?: string;
};

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const hashtag = String(formData.get("hashtag") ?? "").trim();
  const sponsorName = String(formData.get("sponsor_name") ?? "").trim();
  const hdIncluded = formData.get("hd_included") === "on";
  const publicGallery = formData.get("public_gallery") === "on";

  if (!name) {
    return { error: "Le nom de l'événement est obligatoire." };
  }

  const supabase = createAdminClient();
  const code = generateEventCode();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      code,
      name,
      event_date: eventDate || null,
      location: location || null,
      hashtag: hashtag || null,
      sponsor_name: sponsorName || null,
      hd_included: hdIncluded,
      public_gallery: publicGallery,
    })
    .select("id")
    .single();

  if (error || !event) {
    return { error: "Erreur lors de la création : " + error?.message };
  }

  try {
    const rekognition = createRekognitionClient();
    await rekognition.send(
      new CreateCollectionCommand({ CollectionId: collectionIdForEvent(event.id) }),
    );
  } catch (err) {
    // Non bloquant : l'événement existe même si la collection Rekognition échoue.
    // La reconnaissance faciale ne fonctionnera pas tant qu'elle n'est pas créée manuellement.
    console.error("[createEvent] CreateCollection", err);
  }

  return { code };
}
