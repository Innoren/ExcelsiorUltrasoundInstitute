import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2, Circle } from "lucide-react";
import { getCourseProgress } from "@/app/actions/learn";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db } from "@/db";
import { assessments, lessonProgress } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requireUser(["student", "owner", "dean", "instructor"]);

  const course = await db.query.courses.findFirst({
    where: (c, { eq: e }) => e(c.id, courseId),
    with: {
      modules: {
        orderBy: (m, { asc: a }) => [a(m.sortOrder)],
        with: {
          lessons: { orderBy: (l, { asc: a }) => [a(l.sortOrder)] },
        },
      },
    },
  });
  if (!course) notFound();

  const progress = await getCourseProgress(user.id, courseId);
  const completed = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, user.id));
  const done = new Set(completed.map((c) => c.lessonId));
  const quizzes = await db.query.assessments.findMany({
    where: eq(assessments.courseId, courseId),
    orderBy: [asc(assessments.title)],
  });

  return (
    <>
      <PageHero
        eyebrow={course.code}
        title={course.title}
        description="Course outline with modules, lessons, and assessments."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="mb-8 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4">
          <div className="flex justify-between text-sm">
            <span>Course progress</span>
            <span>
              {progress.completed}/{progress.total} · {progress.percent}%
            </span>
          </div>
          <Progress value={progress.percent} className="mt-3 h-2" />
        </div>

        <div className="space-y-4">
          {course.modules
            .filter((m) => m.isPublished)
            .map((mod, idx) => (
              <section
                key={mod.id}
                className="rounded-lg border border-[var(--eui-border)]"
              >
                <div className="border-b border-[var(--eui-border)] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--eui-ink-muted)]">
                    Module {idx + 1}
                  </p>
                  <h3 className="font-semibold">{mod.title}</h3>
                </div>
                <ul className="divide-y divide-[var(--eui-border)]">
                  {mod.lessons
                    .filter((l) => l.isPublished)
                    .map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--eui-teal-soft)]/40"
                        >
                          {done.has(lesson.id) ? (
                            <CheckCircle2 className="size-4 text-[var(--eui-teal)]" />
                          ) : (
                            <Circle className="size-4 text-[var(--eui-ink-muted)]" />
                          )}
                          <span className="flex-1">{lesson.title}</span>
                          <Badge variant="secondary">{lesson.type}</Badge>
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </div>

        {quizzes.filter((q) => q.isPublished).length > 0 ? (
          <div className="mt-10">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--eui-ink-muted)]">
              Assessments
            </h3>
            <div className="space-y-2">
              {quizzes
                .filter((q) => q.isPublished)
                .map((quiz) => (
                  <Link
                    key={quiz.id}
                    href={`/learn/assessments/${quiz.id}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--eui-border)] px-4 py-3 text-sm hover:border-[var(--eui-teal)]"
                  >
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs capitalize text-[var(--eui-ink-muted)]">
                        {quiz.type}
                        {quiz.isLocked ? " · locked" : ""}
                      </p>
                    </div>
                    <span className="text-[var(--eui-teal)]">Open</span>
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
