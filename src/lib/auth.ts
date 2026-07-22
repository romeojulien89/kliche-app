import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admins")
    .select("id, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) redirect("/login?next=/admin");

  return { userId: user.id, name: adminRow.name };
}

export async function requireStudioAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/studio");

  const admin = createAdminClient();
  const [{ data: adminRow }, { data: photographerRow }] = await Promise.all([
    admin.from("admins").select("id, name").eq("id", user.id).maybeSingle(),
    admin.from("photographers").select("id, name").eq("id", user.id).maybeSingle(),
  ]);

  if (!adminRow && !photographerRow) redirect("/login?next=/studio");

  return { userId: user.id, name: adminRow?.name ?? photographerRow?.name ?? "" };
}
