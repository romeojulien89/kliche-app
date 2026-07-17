import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("kliche_guest_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Session invité introuvable." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: guest } = await supabase
    .from("guests")
    .select("id")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!guest) {
    return NextResponse.json({ error: "Session invité introuvable." }, { status: 401 });
  }

  const { data: faceRows } = await supabase
    .from("photo_faces")
    .select("photo_id")
    .eq("guest_id", guest.id);

  const photoIds = Array.from(new Set((faceRows ?? []).map((r) => r.photo_id)));

  if (photoIds.length === 0) {
    return NextResponse.json({ photos: [] });
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path_preview")
    .in("id", photoIds)
    .eq("status", "ready");

  const withUrls = (photos ?? [])
    .filter((p) => p.storage_path_preview)
    .map((p) => ({
      id: p.id,
      url: supabase.storage
        .from("photos-preview")
        .getPublicUrl(p.storage_path_preview!).data.publicUrl,
    }));

  return NextResponse.json({ photos: withUrls });
}
