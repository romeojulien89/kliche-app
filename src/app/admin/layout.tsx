import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name } = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <span className="font-sans text-xs text-foreground/50">{name}</span>
        <form action={logout}>
          <button
            type="submit"
            className="font-sans text-xs text-foreground/60 underline underline-offset-2"
          >
            Déconnexion
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
