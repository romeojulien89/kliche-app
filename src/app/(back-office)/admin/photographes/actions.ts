"use server";

import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type AddPhotographerState = {
  error?: string;
  created?: { email: string; password: string };
};

function generatePassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "x");
}

export async function addPhotographer(
  _prevState: AddPhotographerState,
  formData: FormData,
): Promise<AddPhotographerState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || !email) {
    return { error: "Nom et email requis." };
  }

  const supabase = createAdminClient();
  const password = generatePassword();

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !created.user) {
    return { error: "Erreur lors de la création du compte : " + authError?.message };
  }

  const { error: insertError } = await supabase
    .from("photographers")
    .insert({ id: created.user.id, name, email });

  if (insertError) {
    return { error: "Erreur lors de l'enregistrement : " + insertError.message };
  }

  return { created: { email, password } };
}
