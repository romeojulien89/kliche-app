import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeEventStats } from "@/lib/event-stats";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  const stats = await computeEventStats(event.id);
  return NextResponse.json(stats);
}
