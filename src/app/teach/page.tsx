import Link from "next/link";
import { asc } from "drizzle-orm";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function TeachHomePage() {
  await requireUser(["instructor", "owner", "dean"]);
  const list = await db.query.courses.findMany({
    orderBy: [asc(courses.sortOrder)],
    with: { modules: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Instructor"
        title="Teach on the school site"
        description="Build modules and lessons, publish content, and review the gradebook — without leaving the Excelsior website."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
          >
            <Link href="/teach/courses">Open course builder</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teach/inbox">Student inbox</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teach/gradebook">Gradebook</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {list.map((course) => (
            <Link
              key={course.id}
              href={`/teach/courses/${course.id}`}
              className="flex items-center justify-between rounded-lg border border-[var(--eui-border)] px-4 py-3 hover:border-[var(--eui-teal)]"
            >
              <div>
                <p className="text-xs text-[var(--eui-teal)]">{course.code}</p>
                <p className="font-medium">{course.title}</p>
              </div>
              <span className="text-xs text-[var(--eui-ink-muted)]">
                {course.modules.length} modules
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
