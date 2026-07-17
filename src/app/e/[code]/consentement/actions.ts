"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function recordConsent(code: string) {
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    throw new Error("Événement introuvable.");
  }

  const now = new Date();
  const { data: guest, error } = await supabase
    .from("guests")
    .insert({
      event_id: event.id,
      consent_at: now.toISOString(),
      purge_at: new Date(now.getTime() + THIRTY_DAYS_MS).toISOString(),
    })
    .select("session_token")
    .single();

  if (error || !guest) {
    throw new Error("Erreur lors de l'enregistrement du consentement.");
  }

  const cookieStore = await cookies();
  cookieStore.set("kliche_guest_session", guest.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: THIRTY_DAYS_MS / 1000,
    path: "/",
  });

  redirect(`/e/${code}/selfie`);
}
