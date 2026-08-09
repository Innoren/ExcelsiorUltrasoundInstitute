import { requireUser } from "@/lib/portal/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(["owner"]);
  return children;
}
