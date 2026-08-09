import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { CalendarEvent } from "@/components/portal/learn-calendar";
import { LearnCalendar } from "@/components/portal/learn-calendar";
import { db } from "@/db";
import {
  assessmentAttempts,
  assessments,
  courses,
  enrollments,
  gradeEntries,
} from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

function dateKey(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function LearnCalendarPage() {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);

  const userEnrollments = await db.query.enrollments.findMany({
    where: eq(enrollments.userId, user.id),
    with: { cohort: { with: { program: true } } },
  });

  const programIds = [
    ...new Set(userEnrollments.map((entry) => entry.cohort.programId)),
  ];
  const publishedCourses = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    orderBy: [asc(courses.sortOrder)],
  });
  const mine = publishedCourses.filter((course) =>
    programIds.includes(course.programId),
  );
  const courseIds = mine.map((course) => course.id);

  const [publishedAssessments, attempts, grades] = await Promise.all([
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
      limit: 40,
    }),
  ]);

  const completedAssessmentIds = new Set(
    attempts
      .filter(
        (attempt) =>
          attempt.status === "submitted" || attempt.status === "graded",
      )
      .map((attempt) => attempt.assessmentId),
  );

  const events: CalendarEvent[] = [];

  for (const enrollment of userEnrollments) {
    const cohort = enrollment.cohort;
    const start = dateKey(cohort.startDate);
    if (start) {
      events.push({
        id: `cohort-start-${cohort.id}`,
        title: `${cohort.name} starts`,
        subtitle: cohort.program.name,
        date: start,
        href: "/learn/courses",
        kind: "cohort",
      });
    }
    const end = dateKey(cohort.endDate);
    if (end) {
      events.push({
        id: `cohort-end-${cohort.id}`,
        title: `${cohort.name} ends`,
        subtitle: cohort.program.name,
        date: end,
        href: "/learn/courses",
        kind: "cohort",
      });
    }
  }

  for (const assessment of publishedAssessments) {
    if (completedAssessmentIds.has(assessment.id)) continue;
    const date = dateKey(assessment.updatedAt ?? assessment.createdAt);
    if (!date) continue;
    events.push({
      id: `assessment-${assessment.id}`,
      title: assessment.title,
      subtitle: `${assessment.course.code} · ${assessment.type}`,
      date,
      href: `/learn/assessments/${assessment.id}`,
      kind: "assessment",
    });
  }

  const courseById = new Map(mine.map((course) => [course.id, course]));
  for (const grade of grades) {
    const date = dateKey(grade.gradedAt ?? grade.createdAt);
    if (!date) continue;
    const course = courseById.get(grade.courseId);
    events.push({
      id: `grade-${grade.id}`,
      title: `Graded: ${grade.title}`,
      subtitle: course ? course.code : "Grade entry",
      date,
      href: "/learn/grades",
      kind: "grade",
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <LearnCalendar userId={user.id} events={events} />
    </div>
  );
}
