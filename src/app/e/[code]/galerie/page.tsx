export default function PublicGalleryPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
        Galerie bientôt disponible
      </h1>
      <p className="mt-3 max-w-sm font-sans text-sm text-foreground/60">
        Les photos apparaîtront ici dès que le photographe commencera à en
        envoyer.
      </p>
    </main>
  );
}
