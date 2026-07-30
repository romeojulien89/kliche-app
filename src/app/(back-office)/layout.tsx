import { getBackOfficeAccess } from "@/lib/auth";
import { BackOfficeShell } from "@/components/back-office-shell";

export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name, isAdmin, isPhotographer } = await getBackOfficeAccess();

  return (
    <BackOfficeShell name={name} isAdmin={isAdmin} isPhotographer={isPhotographer}>
      {children}
    </BackOfficeShell>
  );
}
