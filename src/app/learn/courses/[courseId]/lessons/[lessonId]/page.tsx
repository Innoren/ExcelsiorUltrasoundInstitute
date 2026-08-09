import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { markLessonComplete } from "@/app/actions/learn";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { lessonProgress, lessons, modules } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const user = await requireUser(["student", "owner", "dean", "instructor"]);

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { module: true },
  });
  if (!lesson || lesson.module.courseId !== courseId) notFound();

  const siblings = await db.query.lessons.findMany({
    where: and(
      eq(lessons.moduleId, lesson.moduleId),
      eq(lessons.isPublished, true),
    ),
    orderBy: [asc(lessons.sortOrder)],
  });
  const index = siblings.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next =
    index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const done = await db.query.lessonProgress.findFirst({
    where: and(
      eq(lessonProgress.userId, user.id),
      eq(lessonProgress.lessonId, lessonId),
    ),
  });
  const mod = await db.query.modules.findFirst({
    where: eq(modules.id, lesson.moduleId),
  });

  return (
    <>
      <PageHero
        eyebrow={mod?.title ?? "Lesson"}
        title={lesson.title}
        description={`Estimated ${lesson.estimatedMinutes ?? 15} minutes`}
      />
      <Section className="bg-[var(--eui-surface)]">
        <p className="mb-4 text-sm text-[var(--eui-ink-muted)]">
          <Link href={`/learn/courses/${courseId}`} className="hover:underline">
            Back to course
          </Link>
        </p>
        <article className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-6">
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--eui-ink)]">
            {lesson.content || "No content yet."}
          </div>
        </article>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {prev ? (
              <Button asChild variant="outline">
                <Link href={`/learn/courses/${courseId}/lessons/${prev.id}`}>
                  Previous
                </Link>
              </Button>
            ) : null}
            {next ? (
              <Button asChild variant="outline">
                <Link href={`/learn/courses/${courseId}/lessons/${next.id}`}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/learn/courses/${courseId}`}>Back to outline</Link>
              </Button>
            )}
          </div>
          {done ? null : (
            <form action={markLessonComplete}>
              <input type="hidden" name="lessonId" value={lessonId} />
              <input type="hidden" name="courseId" value={courseId} />
              <Button
                type="submit"
                className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              >
                Mark complete
              </Button>
            </form>
          )}
        </div>

        {done ? (
          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[var(--eui-teal)]/30 bg-[var(--eui-teal-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[var(--eui-teal-deep)]">
              Lesson marked complete.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              >
                <Link href={`/learn/courses/${courseId}`}>
                  Back to modules
                </Link>
              </Button>
              {next ? (
                <Button asChild variant="outline">
                  <Link href={`/learn/courses/${courseId}/lessons/${next.id}`}>
                    Continue to next lesson
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
