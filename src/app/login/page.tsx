import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Connexion
      </h1>
      <p className="mt-1 mb-6 font-sans text-sm text-foreground/60">
        Espace organisateur / photographe.
      </p>
      <LoginForm next={next ?? "/admin"} />
    </main>
  );
}
