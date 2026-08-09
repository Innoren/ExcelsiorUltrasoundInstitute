import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/portal/auth";
import { homeForRole } from "@/lib/portal/rbac";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/portal");
  redirect(homeForRole(user.role));
}
