import { createCohort } from "@/app/actions/manage";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { requireUser } from "@/lib/portal/auth";

export default async function CampusCohortsPage() {
  await requireUser(["dean", "owner"]);
  const [programs, cohorts] = await Promise.all([
    db.query.programs.findMany(),
    db.query.cohorts.findMany({ with: { program: true, enrollments: true } }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Cohorts"
        title="Intake management"
        description="Create dated cohorts capped at 20 students."
      />
      <Section className="bg-[var(--eui-surface)]">
        <form
          action={createCohort}
          className="mb-8 grid gap-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4 md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <Label htmlFor="programId">Program</Label>
            <select
              id="programId"
              name="programId"
              required
              className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="name">Cohort name</Label>
            <Input id="name" name="name" required className="mt-1 bg-[var(--eui-surface)]" />
          </div>
          <div>
            <Label htmlFor="maxStudents">Max</Label>
            <Input
              id="maxStudents"
              name="maxStudents"
              type="number"
              defaultValue={20}
              min={1}
              max={20}
              className="mt-1 bg-[var(--eui-surface)]"
            />
          </div>
          <div className="md:col-span-4">
            <Button type="submit" className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]">
              Create cohort
            </Button>
          </div>
        </form>
        <div className="space-y-2">
          {cohorts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-[var(--eui-border)] px-4 py-3"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-[var(--eui-ink-muted)]">
                  {c.program.name} · {c.status}
                </p>
              </div>
              <p className="text-sm">
                {c.enrollments.length}/{c.maxStudents}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
