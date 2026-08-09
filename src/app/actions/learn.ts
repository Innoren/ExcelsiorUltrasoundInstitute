"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/portal/auth";
import { db } from "@/db";
import {
  assessmentAnswers,
  assessmentAttempts,
  assessmentQuestions,
  assessments,
  gradeEntries,
  lessonProgress,
  lessons,
  modules,
} from "@/db/schema";

function scoreObjective(
  type: string,
  correct: unknown,
  answer: unknown,
): boolean {
  if (type === "true_false") {
    return (
      Boolean(correct) ===
      Boolean(answer === true || answer === "true" || answer === "True")
    );
  }
  if (type === "multi_select") {
    const a = Array.isArray(answer) ? [...answer].map(String).sort() : [];
    const c = Array.isArray(correct) ? [...correct].map(String).sort() : [];
    return JSON.stringify(a) === JSON.stringify(c);
  }
  return String(correct) === String(answer);
}

export async function markLessonComplete(formData: FormData) {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (!lessonId) throw new Error("Lesson required");

  await db
    .insert(lessonProgress)
    .values({ userId: user.id, lessonId })
    .onConflictDoNothing();

  revalidatePath("/learn");
  if (courseId) {
    revalidatePath(`/learn/courses/${courseId}`);
    revalidatePath(`/learn/courses/${courseId}/lessons/${lessonId}`);
  }
}

export async function submitAssessment(formData: FormData) {
  const user = await requireUser(["student"]);
  const assessmentId = String(formData.get("assessmentId") ?? "");

  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
  });
  if (!assessment?.isPublished) throw new Error("Assessment unavailable");
  if (assessment.isLocked) throw new Error("Assessment locked");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.assessmentId, assessmentId),
        eq(assessmentAttempts.userId, user.id),
      ),
    );

  if (count >= (assessment.maxAttempts ?? 1)) {
    throw new Error("No attempts remaining");
  }

  const questions = await db.query.assessmentQuestions.findMany({
    where: eq(assessmentQuestions.assessmentId, assessmentId),
    orderBy: [asc(assessmentQuestions.sortOrder)],
  });

  const [attempt] = await db
    .insert(assessmentAttempts)
    .values({
      assessmentId,
      userId: user.id,
      status: "in_progress",
    })
    .returning();

  let pointsEarned = 0;
  let pointsPossible = 0;
  let needsManual = false;

  for (const q of questions) {
    const raw = formData.get(`q_${q.id}`);
    let answer: string | string[] | boolean | null = raw ? String(raw) : null;
    if (q.type === "true_false") {
      answer = answer === "true" || answer === "True";
    }
    if (q.type === "multi_select") {
      answer = formData.getAll(`q_${q.id}`).map(String);
    }

    const pts = Number(q.points);
    pointsPossible += pts;

    if (q.type === "short_answer") {
      needsManual = true;
      await db.insert(assessmentAnswers).values({
        attemptId: attempt.id,
        questionId: q.id,
        answer,
        isCorrect: null,
        pointsAwarded: null,
      });
      continue;
    }

    const correct = scoreObjective(q.type, q.correctAnswer, answer);
    const awarded = correct ? pts : 0;
    pointsEarned += awarded;
    await db.insert(assessmentAnswers).values({
      attemptId: attempt.id,
      questionId: q.id,
      answer,
      isCorrect: correct,
      pointsAwarded: String(awarded),
    });
  }

  const percent =
    pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;

  await db
    .update(assessmentAttempts)
    .set({
      status: needsManual ? "submitted" : "graded",
      submittedAt: new Date(),
      score: String(percent.toFixed(2)),
      pointsEarned: String(pointsEarned),
    })
    .where(eq(assessmentAttempts.id, attempt.id));

  if (!needsManual) {
    await db.insert(gradeEntries).values({
      userId: user.id,
      courseId: assessment.courseId,
      assessmentId: assessment.id,
      gradeCategoryId: assessment.gradeCategoryId,
      title: assessment.title,
      pointsEarned: String(pointsEarned),
      pointsPossible: String(pointsPossible),
      gradedAt: new Date(),
    });
  }

  revalidatePath(`/learn/assessments/${assessmentId}`);
  revalidatePath("/learn/grades");
  revalidatePath(`/learn/courses/${assessment.courseId}`);
}

export async function getCourseProgress(userId: string, courseId: string) {
  const courseModules = await db.query.modules.findMany({
    where: and(eq(modules.courseId, courseId), eq(modules.isPublished, true)),
    with: {
      lessons: {
        where: eq(lessons.isPublished, true),
        orderBy: [asc(lessons.sortOrder)],
      },
    },
    orderBy: [asc(modules.sortOrder)],
  });

  const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
  if (allLessonIds.length === 0) {
    return { completed: 0, total: 0, percent: 0 };
  }

  const rows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));

  const completed = rows.filter((r) => allLessonIds.includes(r.lessonId)).length;
  return {
    completed,
    total: allLessonIds.length,
    percent: Math.round((completed / allLessonIds.length) * 100),
  };
}
