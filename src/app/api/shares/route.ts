import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcast, eventChannelName } from "@/lib/realtime";

export async function POST(request: Request) {
  const { photo_id: photoId } = await request.json();

  if (!photoId) {
    return NextResponse.json({ error: "Photo manquante." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("kliche_guest_session")?.value;

  let guestId: string | null = null;
  if (sessionToken) {
    const { data: guest } = await supabase
      .from("guests")
      .select("id")
      .eq("session_token", sessionToken)
      .maybeSingle();
    guestId = guest?.id ?? null;
  }

  await supabase
    .from("shares")
    .insert({ photo_id: photoId, guest_id: guestId, channel: "whatsapp" });

  const { data: photo } = await supabase
    .from("photos")
    .select("event_id")
    .eq("id", photoId)
    .maybeSingle();

  if (photo) {
    await broadcast(eventChannelName(photo.event_id), "activity").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
