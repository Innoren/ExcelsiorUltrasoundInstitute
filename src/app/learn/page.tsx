import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getCourseProgress } from "@/app/actions/learn";
import { getUnreadMessageCount } from "@/app/actions/messages";
import { CourseFavoritesProvider } from "@/components/portal/course-favorites-provider";
import { CourseRoster } from "@/components/portal/course-roster";
import { FavoriteCoursesBanner } from "@/components/portal/favorite-courses-banner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { db } from "@/db";
import {
  announcements,
  assessmentAttempts,
  assessments,
  courses,
  enrollments,
  gradeEntries,
} from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function LearnDashboardPage() {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);

  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, user.id),
    with: { cohort: { with: { program: true } } },
  });

  const programIds = [...new Set(userEnrollments.map((e) => e.cohort.programId))];
  const cohortIds = userEnrollments.map((e) => e.cohortId);
  const published = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    orderBy: [asc(courses.sortOrder)],
  });
  const mine = published.filter((c) => programIds.includes(c.programId));
  const courseIds = mine.map((c) => c.id);

  const withProgress = await Promise.all(
    mine.map(async (course) => ({
      course,
      progress: await getCourseProgress(user.id, course.id),
      programName:
        userEnrollments.find((e) => e.cohort.programId === course.programId)
          ?.cohort.program.name ?? "Program",
    })),
  );

  const continueCourse =
    withProgress.find((c) => c.progress.percent < 100) ?? withProgress[0];

  const [publishedAssessments, attempts, grades, courseAnnouncements, unread] =
    await Promise.all([
      courseIds.length
        ? db.query.assessments.findMany({
            where: and(
              inArray(assessments.courseId, courseIds),
              eq(assessments.isPublished, true),
            ),
            orderBy: [desc(assessments.updatedAt)],
            with: { course: true },
          })
        : Promise.resolve([]),
      db.query.assessmentAttempts.findMany({
        where: eq(assessmentAttempts.userId, user.id),
      }),
      db.query.gradeEntries.findMany({
        where: eq(gradeEntries.userId, user.id),
        orderBy: [desc(gradeEntries.createdAt)],
        limit: 5,
      }),
      db.query.announcements.findMany({
        orderBy: [desc(announcements.publishedAt)],
        limit: 20,
      }),
      getUnreadMessageCount(user.id),
    ]);

  const courseById = new Map(mine.map((c) => [c.id, c]));

  const attemptedIds = new Set(
    attempts
      .filter((a) => a.status === "submitted" || a.status === "graded")
      .map((a) => a.assessmentId),
  );

  const openWork = publishedAssessments
    .filter((a) => !attemptedIds.has(a.id) && !a.isLocked)
    .slice(0, 4);

  const recentFeedback = grades.filter(
    (g) => g.pointsEarned != null || (g.feedback && g.feedback.length > 0),
  );

  const relevantAnnouncements = courseAnnouncements
    .filter(
      (a) =>
        (a.courseId && courseIds.includes(a.courseId)) ||
        (a.cohortId && cohortIds.includes(a.cohortId)) ||
        (!a.courseId && !a.cohortId),
    )
    .slice(0, 3);

  const firstName = user.firstName?.trim() || "Student";
  const rosterItems = withProgress.map(({ course, progress, programName }) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    subtitle: programName,
    href: `/learn/courses/${course.id}`,
    percent: progress.percent,
  }));

  return (
    <CourseFavoritesProvider userId={user.id}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <FavoriteCoursesBanner items={rosterItems} />

        <section className="eui-rise relative overflow-hidden rounded-2xl bg-[var(--eui-hero)] px-6 py-8 text-[var(--eui-hero-fg)] md:px-10 md:py-10">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_srgb,var(--eui-teal-glow)_28%,transparent),_transparent_50%),linear-gradient(135deg,var(--eui-hero)_0%,#12363c_55%,var(--eui-teal)_130%)]"
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--eui-teal-glow)]">
              Excelsior Ultrasound Institute
            </p>
            <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-base text-[var(--eui-hero-fg)]/75">
              Your sonography coursework, grades, and instructor messages in one
              place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {continueCourse ? (
                <Button
                  asChild
                  className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
                >
                  <Link href={`/learn/courses/${continueCourse.course.id}`}>
                    Resume {continueCourse.course.code}
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/learn/grades">Open grades</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/learn/inbox">
                  Inbox{unread > 0 ? ` · ${unread}` : ""}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {continueCourse ? (
          <section className="eui-rise eui-rise-delay-1 mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--eui-teal)]">
              Continue learning
            </p>
            <div className="mt-3 flex flex-col gap-4 border-y border-[var(--eui-border)] py-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                  {continueCourse.course.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
                  {continueCourse.course.code} · {continueCourse.programName}
                </p>
                <Progress
                  value={continueCourse.progress.percent}
                  className="mt-4 h-2 max-w-md"
                />
                <p className="mt-2 text-xs text-[var(--eui-ink-muted)]">
                  {continueCourse.progress.percent}% complete
                </p>
              </div>
              <Button
                asChild
                className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              >
                <Link href={`/learn/courses/${continueCourse.course.id}`}>
                  Open course
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <p className="mt-8 text-[var(--eui-ink-muted)]">
            You are not enrolled yet. Ask the Dean or Owner to place you in a
            cohort.
          </p>
        )}

        <div className="eui-rise eui-rise-delay-2 mt-10">
          <CourseRoster
            heading="Course roster"
            description="Star courses to pin them in your favorites banner."
            action={
              <Link
                href="/learn/courses"
                className="text-sm font-medium text-[var(--eui-teal)] hover:underline"
              >
                View all
              </Link>
            }
            items={rosterItems}
          />
        </div>

      <section className="eui-rise eui-rise-delay-3 mt-10 grid gap-8 md:grid-cols-3">
        <OverviewBlock title="Open work">
          {openWork.length === 0 ? (
            <p className="text-sm text-[var(--eui-ink-muted)]">
              No quizzes waiting.
            </p>
          ) : (
            <ul className="space-y-3">
              {openWork.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/learn/assessments/${item.id}`}
                    className="text-sm font-medium text-[var(--eui-teal-deep)] hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-[var(--eui-ink-muted)]">
                    {item.course.code}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </OverviewBlock>

        <OverviewBlock title="Recent scores">
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-[var(--eui-ink-muted)]">
              Graded work appears here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentFeedback.map((g) => {
                const earned = Number(g.pointsEarned ?? 0);
                const possible = Number(g.pointsPossible);
                const course = courseById.get(g.courseId);
                return (
                  <li key={g.id}>
                    <p className="text-sm font-medium">{g.title}</p>
                    <p className="text-xs text-[var(--eui-ink-muted)]">
                      {g.pointsEarned == null
                        ? "Pending"
                        : `${earned}/${possible}`}
                      {course ? ` · ${course.code}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/learn/grades"
            className="mt-4 inline-block text-sm font-medium text-[var(--eui-teal)] hover:underline"
          >
            Full gradebook
          </Link>
        </OverviewBlock>

        <OverviewBlock title="From faculty">
          {relevantAnnouncements.length === 0 ? (
            <p className="text-sm text-[var(--eui-ink-muted)]">
              No announcements yet. Message instructors anytime from Inbox.
            </p>
          ) : (
            <ul className="space-y-3">
              {relevantAnnouncements.map((item) => (
                <li key={item.id}>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--eui-ink-muted)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/learn/inbox"
            className="mt-4 inline-block text-sm font-medium text-[var(--eui-teal)] hover:underline"
          >
            Open inbox
          </Link>
        </OverviewBlock>
      </section>
      </div>
    </CourseFavoritesProvider>
  );
}

function OverviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--eui-ink-muted)]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
