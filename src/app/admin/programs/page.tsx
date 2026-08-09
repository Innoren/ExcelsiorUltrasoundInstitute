import { createCourse, createProgram } from "@/app/actions/manage";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminProgramsPage() {
  await requireUser(["owner"]);
  const programs = await db.query.programs.findMany({
    with: { courses: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="Programs & courses"
        description="Create diploma and ARDMS prep programs, then add specialty courses."
      />
      <Section className="bg-[var(--eui-surface)]">
        <form
          action={createProgram}
          className="mb-8 space-y-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4"
        >
          <h3 className="text-sm font-semibold">New program</h3>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required className="mt-1 bg-[var(--eui-surface)]" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" className="mt-1 bg-[var(--eui-surface)]" />
          </div>
          <div>
            <Label htmlFor="durationMonths">Duration (months)</Label>
            <Input
              id="durationMonths"
              name="durationMonths"
              type="number"
              defaultValue={18}
              className="mt-1 w-40 bg-[var(--eui-surface)]"
            />
          </div>
          <Button type="submit" className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]">
            Create program
          </Button>
        </form>

        <div className="space-y-4">
          {programs.map((program) => (
            <section
              key={program.id}
              className="rounded-lg border border-[var(--eui-border)] p-4"
            >
              <h3 className="font-semibold">{program.name}</h3>
              <p className="text-sm text-[var(--eui-ink-muted)]">
                {program.durationMonths} months · {program.courses.length} courses
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {program.courses.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-[var(--eui-teal)]">
                      {c.code}
                    </span>{" "}
                    {c.title}
                  </li>
                ))}
              </ul>
              <form
                action={createCourse}
                className="mt-4 grid gap-2 border-t border-[var(--eui-border)] pt-4 md:grid-cols-4"
              >
                <input type="hidden" name="programId" value={program.id} />
                <Input name="code" placeholder="Code" required />
                <Input
                  name="title"
                  placeholder="Course title"
                  required
                  className="md:col-span-2"
                />
                <Button type="submit" variant="secondary">
                  Add course
                </Button>
              </form>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
