import { notFound } from "next/navigation";
import { createLesson, createModule } from "@/app/actions/manage";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { requireUser } from "@/lib/portal/auth";

export default async function TeachCourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireUser(["instructor", "owner", "dean"]);

  const course = await db.query.courses.findFirst({
    where: (c, { eq }) => eq(c.id, courseId),
    with: {
      modules: {
        orderBy: (m, { asc }) => [asc(m.sortOrder)],
        with: {
          lessons: { orderBy: (l, { asc }) => [asc(l.sortOrder)] },
        },
      },
    },
  });
  if (!course) notFound();

  return (
    <>
      <PageHero
        eyebrow={course.code}
        title={course.title}
        description="Add modules and lessons for students on the school site."
      />
      <Section className="bg-[var(--eui-surface)]">
        <form
          action={createModule}
          className="mb-8 flex flex-col gap-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4 sm:flex-row"
        >
          <input type="hidden" name="courseId" value={courseId} />
          <Input name="title" placeholder="New module title" required />
          <Button
            type="submit"
            className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
          >
            Add module
          </Button>
        </form>

        <div className="space-y-4">
          {course.modules.map((mod, idx) => (
            <section
              key={mod.id}
              className="rounded-lg border border-[var(--eui-border)] p-4"
            >
              <h3 className="font-semibold">
                Module {idx + 1}: {mod.title}
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-[var(--eui-ink-muted)]">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id}>• {lesson.title}</li>
                ))}
                {mod.lessons.length === 0 ? <li>No lessons yet</li> : null}
              </ul>
              <form
                action={createLesson}
                className="mt-4 space-y-3 border-t border-[var(--eui-border)] pt-4"
              >
                <input type="hidden" name="moduleId" value={mod.id} />
                <input type="hidden" name="courseId" value={courseId} />
                <div>
                  <Label htmlFor={`t-${mod.id}`}>Lesson title</Label>
                  <Input id={`t-${mod.id}`} name="title" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor={`c-${mod.id}`}>Content</Label>
                  <Textarea id={`c-${mod.id}`} name="content" className="mt-1" rows={4} />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Add lesson
                </Button>
              </form>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
