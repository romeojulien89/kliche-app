import Link from "next/link";

export function BackLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 font-sans text-sm text-foreground/60 transition-colors hover:text-accent ${className}`}
    >
      <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">
        ←
      </span>
      {label}
    </Link>
  );
}
