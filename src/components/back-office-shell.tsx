import { logout } from "@/app/login/actions";
import { SidebarNav } from "./sidebar-nav";

export function BackOfficeShell({
  name,
  isAdmin,
  isPhotographer,
  children,
}: {
  name: string;
  isAdmin: boolean;
  isPhotographer: boolean;
  children: React.ReactNode;
}) {
  const items = [
    ...(isAdmin
      ? [
          { href: "/admin", label: "Événements" },
          { href: "/admin/photos", label: "Base de photos" },
          { href: "/admin/photographes", label: "Photographes" },
        ]
      : []),
    ...(isAdmin || isPhotographer ? [{ href: "/studio", label: "Studio" }] : []),
  ];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border px-4 pt-16 pb-4 md:w-56 md:border-b-0 md:border-r md:px-3 md:py-6">
        <span className="hidden px-3 font-display text-lg font-bold text-foreground md:block">
          Kliché
        </span>
        <SidebarNav items={items} />
        <div className="hidden flex-col gap-1 border-t border-border pt-4 md:mt-auto md:flex">
          <span className="px-3 font-sans text-xs text-foreground/50">{name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="px-3 text-left font-sans text-xs text-foreground/60 underline underline-offset-2"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-6 py-2 md:hidden">
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
    </div>
  );
}
