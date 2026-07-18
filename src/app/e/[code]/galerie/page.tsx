import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PhotoGrid } from "../photo-grid";

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, public_gallery, hashtag, hd_included")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!event) {
    notFound();
  }

  if (!event.public_gallery) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Galerie non publique
        </h1>
        <p className="mt-3 max-w-sm font-sans text-sm text-foreground/60">
          L&apos;organisateur n&apos;a pas activé la galerie publique pour cet
          événement.
        </p>
      </main>
    );
  }

  // photos n'a pas de policy RLS publique (accès invité normalement scoppé à ses propres
  // photos via Rekognition) — ici l'accès est déjà filtré côté serveur par public_gallery.
  const admin = createAdminClient();
  const { data: photos } = await admin
    .from("photos")
    .select("id, storage_path_preview")
    .eq("event_id", event.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  const withUrls = (photos ?? [])
    .filter((p) => p.storage_path_preview)
    .map((p) => ({
      id: p.id,
      url: admin.storage
        .from("photos-preview")
        .getPublicUrl(p.storage_path_preview!).data.publicUrl,
    }));

  return (
    <main className="flex-1 px-6 py-16">
      <h1 className="font-display text-center text-2xl font-bold text-foreground sm:text-3xl">
        {event.name}
      </h1>

      {withUrls.length === 0 ? (
        <p className="mt-8 text-center font-sans text-sm text-foreground/60">
          Les photos apparaîtront ici dès que le photographe commencera à en
          envoyer.
        </p>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl">
          <PhotoGrid
            photos={withUrls}
            hashtag={event.hashtag}
            hdIncluded={event.hd_included}
          />
        </div>
      )}
    </main>
  );
}
