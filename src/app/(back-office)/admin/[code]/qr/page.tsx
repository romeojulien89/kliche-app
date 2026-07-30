import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QrDisplay } from "./qr-display";

export default async function QrPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("code")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return <QrDisplay code={event.code} />;
}
