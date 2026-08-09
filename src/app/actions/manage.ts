"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/portal/auth";
import { can } from "@/lib/portal/rbac";
import { db } from "@/db";
import { school } from "@/lib/school";
import {
  auditLogs,
  cohorts,
  courses,
  enrollments,
  lessons,
  modules,
  programs,
  users,
  type Role,
} from "@/db/schema";

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProgram(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  if (!can.managePrograms(actor.role)) throw new Error("Forbidden");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");

  const [program] = await db
    .insert(programs)
    .values({
      name,
      slug: slugify(name),
      description: String(formData.get("description") ?? "") || null,
      durationMonths: Number(formData.get("durationMonths") ?? 18) || 18,
      status: "active",
      tuitionAmount: String(school.program.tuition),
      registrationFee: String(school.program.registrationFee),
      uniformFee: String(school.program.uniformFee),
    })
    .returning();

  await audit(actor.id, "program.create", "program", program.id);
  revalidatePath("/admin");
  revalidatePath("/campus");
}

export async function createCohort(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  const programId = String(formData.get("programId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const maxStudents = Number(formData.get("maxStudents") ?? 20);

  if (!programId || !name) throw new Error("Missing fields");

  const [cohort] = await db
    .insert(cohorts)
    .values({
      programId,
      name,
      maxStudents: Math.min(Math.max(maxStudents || 20, 1), 20),
      status: "planned",
    })
    .returning();

  await audit(actor.id, "cohort.create", "cohort", cohort.id);
  revalidatePath("/campus");
  revalidatePath("/admin");
}

export async function enrollStudent(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  const cohortId = String(formData.get("cohortId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!cohortId || !userId) throw new Error("Missing fields");

  const cohort = await db.query.cohorts.findFirst({
    where: eq(cohorts.id, cohortId),
  });
  if (!cohort) throw new Error("Cohort not found");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.cohortId, cohortId));

  if (count >= cohort.maxStudents) {
    throw new Error("Cohort is full");
  }

  await db
    .insert(enrollments)
    .values({ userId, cohortId, status: "active" })
    .onConflictDoNothing();

  await audit(actor.id, "enrollment.create", "enrollment", `${userId}:${cohortId}`);
  revalidatePath("/campus");
  revalidatePath("/campus/enrollments");
  revalidatePath("/learn");
}

export async function unenrollStudent(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  if (!can.enrollStudents(actor.role)) throw new Error("Forbidden");

  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  if (!enrollmentId) throw new Error("Enrollment required");

  const enrollment = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
  });
  if (!enrollment) throw new Error("Enrollment not found");

  await db.delete(enrollments).where(eq(enrollments.id, enrollmentId));

  await audit(
    actor.id,
    "enrollment.remove",
    "enrollment",
    `${enrollment.userId}:${enrollment.cohortId}`,
  );
  revalidatePath("/campus");
  revalidatePath("/campus/enrollments");
  revalidatePath("/learn");
  revalidatePath("/admin");
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!userId || !["owner", "dean", "instructor", "student"].includes(role)) {
    throw new Error("Invalid");
  }
  if (userId === actor.id && role !== "owner") {
    throw new Error("Cannot demote yourself");
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await audit(actor.id, "user.role_update", "user", userId);
  revalidatePath("/admin");
}

export async function createModule(formData: FormData) {
  const actor = await requireUser(["owner", "dean", "instructor"]);
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) throw new Error("Missing fields");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(modules)
    .where(eq(modules.courseId, courseId));

  await db.insert(modules).values({
    courseId,
    title,
    sortOrder: count,
    isPublished: true,
  });

  await audit(actor.id, "module.create", "module", courseId);
  revalidatePath(`/teach/courses/${courseId}`);
  revalidatePath(`/learn/courses/${courseId}`);
}

export async function createLesson(formData: FormData) {
  const actor = await requireUser(["owner", "dean", "instructor"]);
  const moduleId = String(formData.get("moduleId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!moduleId || !title) throw new Error("Missing fields");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(eq(lessons.moduleId, moduleId));

  await db.insert(lessons).values({
    moduleId,
    title,
    content: content || null,
    type: "text",
    sortOrder: count,
    isPublished: true,
  });

  await audit(actor.id, "lesson.create", "lesson", moduleId);
  if (courseId) {
    revalidatePath(`/teach/courses/${courseId}`);
    revalidatePath(`/learn/courses/${courseId}`);
  }
}

export async function createCourse(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  const programId = String(formData.get("programId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!programId || !code || !title) throw new Error("Missing fields");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses)
    .where(eq(courses.programId, programId));

  await db.insert(courses).values({
    programId,
    code,
    title,
    description: String(formData.get("description") ?? "") || null,
    sortOrder: count,
    isPublished: true,
  });

  await audit(actor.id, "course.create", "course", programId);
  revalidatePath("/admin");
  revalidatePath("/teach");
}

export async function createDemoStudent(formData: FormData) {
  const actor = await requireUser(["owner", "dean"]);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "student123");

  if (!email) throw new Error("Email required");

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      role: "student",
    })
    .onConflictDoNothing();

  await audit(actor.id, "user.create", "user", email);
  revalidatePath("/campus");
  revalidatePath("/admin");
}
