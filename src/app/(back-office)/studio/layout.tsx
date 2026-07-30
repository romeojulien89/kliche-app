import { requireStudioAccess } from "@/lib/auth";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudioAccess();
  return children;
}
