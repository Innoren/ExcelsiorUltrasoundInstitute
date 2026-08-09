import { requireUser } from "@/lib/portal/auth";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(["instructor", "owner", "dean"]);
  return children;
}
