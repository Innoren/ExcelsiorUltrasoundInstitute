import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { requireUser } from "@/lib/portal/auth";

export default async function CampusHomePage() {
  await requireUser(["dean", "owner"]);
  const [cohorts, enrollments, students] = await Promise.all([
    db.query.cohorts.findMany(),
    db.query.enrollments.findMany(),
    db.query.users.findMany({ where: (u, { eq }) => eq(u.role, "student") }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Dean / campus"
        title="Run cohorts and enrollments"
        description="Open intakes (max 20), enroll students, and keep the diploma program moving."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--eui-teal)]">
              {cohorts.length}
            </p>
            <p className="text-sm text-[var(--eui-ink-muted)]">Cohorts</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--eui-teal)]">
              {enrollments.length}
            </p>
            <p className="text-sm text-[var(--eui-ink-muted)]">Enrollments</p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--eui-teal)]">
              {students.length}
            </p>
            <p className="text-sm text-[var(--eui-ink-muted)]">Students</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]">
            <Link href="/campus/enrollments">Manage enrollments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/campus/cohorts">Manage cohorts</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
