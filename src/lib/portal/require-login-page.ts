import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/portal/auth";
import { homeForRole } from "@/lib/portal/rbac";

/** Marketing routes are closed — send visitors to login or their dashboard. */
export async function redirectClosedPublicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/portal");
  redirect(homeForRole(user.role));
}
