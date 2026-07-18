import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

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

  return NextResponse.json({ ok: true });
}
