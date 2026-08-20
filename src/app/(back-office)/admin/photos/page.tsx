import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BackLink } from "@/components/back-link";
import { DeletePhotoForm } from "@/components/delete-photo-button";
import { deletePhoto } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Envoyée",
  processing: "Traitement…",
  indexed: "Indexée",
  ready: "Prête",
  error: "Erreur",
};

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventCode } = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, code")
    .order("created_at", { ascending: false });

  const selectedEvent = eventCode
    ? events?.find((e) => e.code === eventCode.toUpperCase())
    : undefined;

  let photosQuery = admin
    .from("photos")
    .select("id, storage_path_preview, status, created_at, events(name, code)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (selectedEvent) {
    photosQuery = photosQuery.eq("event_id", selectedEvent.id);
  }

  const { data: photos } = await photosQuery;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      {selectedEvent ? (
        <BackLink
          href={`/admin/${selectedEvent.code}`}
          label="Retour à l'événement"
          className="cascade mb-4"
        />
      ) : null}
      <h1 className="font-display text-2xl font-bold text-foreground">
        Base de photos
      </h1>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        {photos?.length ?? 0} photo(s){selectedEvent ? ` — ${selectedEvent.name}` : ""}
        , 60 les plus récentes maximum.
      </p>

      <form className="mb-6 flex items-center gap-2" method="get">
        <select
          name="event"
          defaultValue={eventCode ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        >
          <option value="">Tous les événements</option>
          {events?.map((event) => (
            <option key={event.id} value={event.code}>
              {event.name} ({event.code})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2 font-sans text-sm text-foreground"
        >
          Filtrer
        </button>
      </form>

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, i) => {
            const previewUrl = photo.storage_path_preview
              ? admin.storage.from("photos-preview").getPublicUrl(photo.storage_path_preview)
                  .data.publicUrl
              : null;
            const event = Array.isArray(photo.events) ? photo.events[0] : photo.events;

            return (
              <div
                key={photo.id}
                style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                className="cascade flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-border/40">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 px-2 py-2">
                  <span className="font-sans text-xs text-foreground/60">
                    {event?.name ?? "—"}
                  </span>
                  <span
                    className={`font-sans text-xs ${
                      photo.status === "error" ? "text-red-500" : "text-foreground/50"
                    }`}
                  >
                    {STATUS_LABEL[photo.status] ?? photo.status}
                  </span>
                  <DeletePhotoForm photoId={photo.id} action={deletePhoto} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-sans text-sm text-foreground/60">Aucune photo.</p>
      )}
    </main>
  );
}
