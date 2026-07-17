export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div
        role="img"
        aria-label="Rocket Corporation"
        className="cascade mask-logo text-accent h-4 sm:h-5"
        style={{
          animationDelay: "0.1s",
          aspectRatio: "1772 / 482",
          WebkitMaskImage: "url(/rocket-corporation.png)",
          maskImage: "url(/rocket-corporation.png)",
        }}
      />

      <h1
        className="cascade font-display mt-6 text-6xl font-bold tracking-[0.08em] text-foreground sm:text-8xl"
        style={{ animationDelay: "0.25s" }}
      >
        KLICHÉ
      </h1>

      <p
        className="cascade mt-6 max-w-md text-balance font-sans text-base text-foreground/70 sm:text-lg"
        style={{ animationDelay: "0.4s" }}
      >
        Vos photos d&apos;événement, retrouvées en un instant grâce à la
        reconnaissance faciale.
      </p>

      <div
        className="cascade mt-10 h-px w-16 bg-accent"
        style={{ animationDelay: "0.55s" }}
        aria-hidden="true"
      />

      <p
        className="cascade mt-10 font-sans text-sm text-foreground/50"
        style={{ animationDelay: "0.7s" }}
      >
        Scannez le QR code de votre événement pour retrouver vos clichés.
      </p>

      <footer className="fixed bottom-4 left-0 w-full text-center font-sans text-xs text-foreground/40">
        Propulsé par Kliché · Rocket Corporation
      </footer>
    </main>
  );
}
