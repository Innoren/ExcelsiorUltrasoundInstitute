import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type Role, type User } from "@/db/schema";
import { homeForRole } from "@/lib/portal/rbac";
import { getSession } from "@/lib/portal/session";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireUser(allowed?: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal");
  if (allowed && !allowed.includes(user.role)) {
    redirect(homeForRole(user.role));
  }
  return user;
}

export function displayName(user: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}
