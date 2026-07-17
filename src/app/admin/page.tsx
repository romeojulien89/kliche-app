import { CreateEventForm } from "./create-event-form";

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-24">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Nouvel événement
      </h1>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        Espace organisateur — non protégé pour l&apos;instant.
      </p>
      <CreateEventForm />
    </main>
  );
}
