"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { homeForRole } from "@/lib/portal/rbac";
import { createSession, destroySession } from "@/lib/portal/session";

function safeNextPath(value: FormDataEntryValue | null, roleHome: string) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return roleHome;
  }
  if (next === "/portal") return roleHome;
  return next;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/portal?error=missing");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.isActive) {
    redirect("/portal?error=invalid");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect("/portal?error=invalid");
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
  });

  const roleHome = homeForRole(user.role);
  redirect(safeNextPath(formData.get("next"), roleHome));
}

export async function logoutAction() {
  await destroySession();
  redirect("/portal");
}
