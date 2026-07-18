import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: photo } = await supabase
    .from("photos")
    .select("event_id, storage_path_hd")
    .eq("id", id)
    .maybeSingle();

  if (!photo || !photo.storage_path_hd) {
    return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("hd_included")
    .eq("id", photo.event_id)
    .maybeSingle();

  if (!event?.hd_included) {
    return NextResponse.json(
      { error: "HD non disponible pour cet événement." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.storage
    .from("photos-hd")
    .createSignedUrl(photo.storage_path_hd, 60);

  if (error || !data) {
    return NextResponse.json({ error: "Erreur lors de la génération du lien." }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
