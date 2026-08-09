import { requireUser } from "@/lib/portal/auth";

export default async function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(["dean", "owner"]);
  return children;
}
