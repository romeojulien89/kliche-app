import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SelfieCapture } from "./selfie-capture";

export default async function SelfiePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("kliche_guest_session")?.value;

  if (!sessionToken) {
    redirect(`/e/${code}/consentement`);
  }

  const supabase = createAdminClient();
  const { data: guest } = await supabase
    .from("guests")
    .select("id, selfie_face_id, event_id")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!guest) {
    redirect(`/e/${code}/consentement`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("hashtag, hd_included")
    .eq("id", guest.event_id)
    .maybeSingle();

  return (
    <SelfieCapture
      guestId={guest.id}
      alreadyCaptured={!!guest.selfie_face_id}
      hashtag={event?.hashtag ?? null}
      hdIncluded={event?.hd_included ?? false}
    />
  );
}
