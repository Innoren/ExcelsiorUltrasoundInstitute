import { requireUser } from "@/lib/portal/auth";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(["student", "owner", "dean", "instructor"]);
  return children;
}
