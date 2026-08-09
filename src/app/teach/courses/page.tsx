import Link from "next/link";
import { asc } from "drizzle-orm";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function TeachCoursesPage() {
  await requireUser(["instructor", "owner", "dean"]);
  const list = await db.query.courses.findMany({
    orderBy: [asc(courses.sortOrder)],
    with: { program: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Course builder"
        title="Courses you can edit"
        description="Add modules and lessons for diploma and prep courses."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="space-y-2">
          {list.map((course) => (
            <Link
              key={course.id}
              href={`/teach/courses/${course.id}`}
              className="block rounded-lg border border-[var(--eui-border)] p-4 hover:border-[var(--eui-teal)]"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--eui-teal)]">{course.code}</p>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-[var(--eui-ink-muted)]">
                    {course.program.name}
                  </p>
                </div>
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
