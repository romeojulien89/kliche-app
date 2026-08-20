"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    // Couvre aussi les sous-pages d'un événement (/admin/<code>, /qr, /rapport-sponsor),
    // mais pas /admin/photos ni /admin/photographes qui ont leur propre item.
    return (
      pathname === "/admin" ||
      (pathname.startsWith("/admin/") &&
        !pathname.startsWith("/admin/photos") &&
        !pathname.startsWith("/admin/photographes"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible">
      {items.map((item, i) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ animationDelay: `${i * 0.05}s` }}
            className={`cascade shrink-0 rounded-md border-l-2 px-3 py-2 font-sans text-sm transition-all duration-200 md:shrink ${
              active
                ? "border-accent bg-accent/15 text-accent"
                : "border-transparent text-foreground/70 hover:border-accent/40 hover:bg-surface hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
