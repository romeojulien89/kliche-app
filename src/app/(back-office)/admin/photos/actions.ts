"use server";

import { revalidatePath } from "next/cache";
import { DeleteFacesCommand } from "@aws-sdk/client-rekognition";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRekognitionClient, collectionIdForEvent } from "@/lib/rekognition";

export async function deletePhoto(formData: FormData) {
  await requireAdmin();

  const photoId = String(formData.get("photoId") ?? "");
  if (!photoId) return;

  const supabase = createAdminClient();

  const { data: photo } = await supabase
    .from("photos")
    .select("id, event_id, storage_path_hd, storage_path_preview")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) return;

  const { data: faces } = await supabase
    .from("photo_faces")
    .select("face_id")
    .eq("photo_id", photoId);

  if (faces && faces.length > 0) {
    try {
      const rekognition = createRekognitionClient();
      await rekognition.send(
        new DeleteFacesCommand({
          CollectionId: collectionIdForEvent(photo.event_id),
          FaceIds: faces.map((f) => f.face_id),
        }),
      );
    } catch (err) {
      console.error("[admin/photos] DeleteFaces", photoId, err);
    }
  }

  await Promise.all([
    photo.storage_path_hd
      ? supabase.storage.from("photos-hd").remove([photo.storage_path_hd])
      : Promise.resolve(),
    photo.storage_path_preview
      ? supabase.storage.from("photos-preview").remove([photo.storage_path_preview])
      : Promise.resolve(),
  ]);

  // photo_faces (ON DELETE CASCADE) et shares (ON DELETE CASCADE) suivent automatiquement.
  await supabase.from("photos").delete().eq("id", photoId);

  revalidatePath("/admin/photos");
}
