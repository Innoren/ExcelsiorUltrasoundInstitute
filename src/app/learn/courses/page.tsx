import { asc, eq } from "drizzle-orm";
import { getCourseProgress } from "@/app/actions/learn";
import { CourseFavoritesProvider } from "@/components/portal/course-favorites-provider";
import { CourseRoster } from "@/components/portal/course-roster";
import { FavoriteCoursesBanner } from "@/components/portal/favorite-courses-banner";
import { PageHeader } from "@/components/portal/page-header";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function LearnCoursesPage() {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);
  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, user.id),
  });
  const cohorts = await db.query.cohorts.findMany();
  const programIds = new Set(
    cohorts
      .filter((c) => userEnrollments.some((e) => e.cohortId === c.id))
      .map((c) => c.programId),
  );
  const list = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    orderBy: [asc(courses.sortOrder)],
    with: { program: true },
  });
  const mine = list.filter((c) => programIds.has(c.programId));
  const withProgress = await Promise.all(
    mine.map(async (course) => ({
      course,
      progress: await getCourseProgress(user.id, course.id),
    })),
  );

  const rosterItems = withProgress.map(({ course, progress }) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    subtitle: course.program.name,
    href: `/learn/courses/${course.id}`,
    percent: progress.percent,
  }));

  return (
    <CourseFavoritesProvider userId={user.id}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <PageHeader
          title="Courses"
          description="Star courses to pin them up top. Switch between list and grid anytime."
        />
        <FavoriteCoursesBanner items={rosterItems} />
        <CourseRoster items={rosterItems} />
      </div>
    </CourseFavoritesProvider>
  );
}
