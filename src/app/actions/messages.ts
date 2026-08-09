"use server";

import { and, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { portalMessages, users, type Role } from "@/db/schema";
import { displayName, requireUser } from "@/lib/portal/auth";

const STAFF_ROLES: Role[] = ["instructor", "dean", "owner"];
const PORTAL_ROLES: Role[] = ["student", "instructor", "dean", "owner"];

export type PortalRecipient = {
  id: string;
  name: string;
  role: Role;
};

function inboxPathForRole(role: Role) {
  return role === "student" ? "/learn/inbox" : "/teach/inbox";
}

/**
 * On-site portal messaging only: store a row in `portal_messages`.
 * Never sends email, SMS, or any external channel.
 */
export async function sendPortalMessage(formData: FormData) {
  const sender = await requireUser(PORTAL_ROLES);

  const recipientId = String(formData.get("recipientId") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const returnToRaw = String(formData.get("returnTo") ?? "").trim();
  const returnTo =
    returnToRaw === "/teach/inbox" || returnToRaw === "/learn/inbox"
      ? returnToRaw
      : inboxPathForRole(sender.role);

  const fail = (code: string): never => {
    redirect(`${returnTo}?error=${encodeURIComponent(code)}`);
  };

  if (!recipientId || !subject || !body) fail("missing");
  if (recipientId === sender.id) fail("self");

  const recipient = await db.query.users.findFirst({
    where: and(eq(users.id, recipientId), eq(users.isActive, true)),
  });
  if (!recipient) {
    redirect(`${returnTo}?error=recipient`);
  }

  // Students may only message staff accounts on the portal.
  if (sender.role === "student" && !STAFF_ROLES.includes(recipient.role)) {
    redirect(`${returnTo}?error=forbidden`);
  }

  // Staff may message students or other staff — still portal users only.
  if (
    STAFF_ROLES.includes(sender.role) &&
    !PORTAL_ROLES.includes(recipient.role)
  ) {
    redirect(`${returnTo}?error=forbidden`);
  }

  await db.insert(portalMessages).values({
    senderId: sender.id,
    recipientId: recipient.id,
    subject,
    body,
  });

  revalidatePath("/learn/inbox");
  revalidatePath("/teach/inbox");
  revalidatePath("/learn");
  revalidatePath("/teach");

  redirect(`${returnTo}?sent=1`);
}

export async function markMessageRead(formData: FormData) {
  const user = await requireUser(PORTAL_ROLES);
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) return;

  const message = await db.query.portalMessages.findFirst({
    where: and(
      eq(portalMessages.id, messageId),
      eq(portalMessages.recipientId, user.id),
      isNull(portalMessages.readAt),
    ),
  });
  if (!message) return;

  await db
    .update(portalMessages)
    .set({ readAt: new Date() })
    .where(eq(portalMessages.id, messageId));

  revalidatePath("/learn/inbox");
  revalidatePath("/teach/inbox");
  revalidatePath("/learn");
}

export async function getUnreadMessageCount(userId: string) {
  const unread = await db.query.portalMessages.findMany({
    where: and(
      eq(portalMessages.recipientId, userId),
      isNull(portalMessages.readAt),
    ),
    columns: { id: true },
  });
  return unread.length;
}

export async function listMailbox(userId: string) {
  return db.query.portalMessages.findMany({
    where: or(
      eq(portalMessages.recipientId, userId),
      eq(portalMessages.senderId, userId),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      sender: true,
      recipient: true,
      course: true,
    },
  });
}

/** Portal users a student can message (instructors / dean / owner). */
export async function listMessageableStaff(): Promise<PortalRecipient[]> {
  await requireUser(PORTAL_ROLES);
  const staff = await db.query.users.findMany({
    where: and(eq(users.isActive, true), inArray(users.role, STAFF_ROLES)),
    orderBy: (table, { asc }) => [asc(table.lastName), asc(table.firstName)],
  });
  return staff.map((user) => ({
    id: user.id,
    name: displayName(user),
    role: user.role,
  }));
}

/** Portal users staff can message (students + other staff). */
export async function listStaffRecipients(
  actorId: string,
): Promise<PortalRecipient[]> {
  await requireUser(["instructor", "dean", "owner"]);
  const people = await db.query.users.findMany({
    where: and(eq(users.isActive, true), ne(users.id, actorId)),
    orderBy: (table, { asc }) => [asc(table.lastName), asc(table.firstName)],
  });
  return people
    .filter((user) => PORTAL_ROLES.includes(user.role))
    .map((user) => ({
      id: user.id,
      name: displayName(user),
      role: user.role,
    }));
}
