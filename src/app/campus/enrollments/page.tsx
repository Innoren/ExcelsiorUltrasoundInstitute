import {
  createDemoStudent,
  enrollStudent,
  unenrollStudent,
} from "@/app/actions/manage";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { requireUser } from "@/lib/portal/auth";

export default async function CampusEnrollmentsPage() {
  await requireUser(["dean", "owner"]);
  const [cohorts, students, enrollments] = await Promise.all([
    db.query.cohorts.findMany({ with: { program: true } }),
    db.query.users.findMany({ where: (u, { eq }) => eq(u.role, "student") }),
    db.query.enrollments.findMany({ with: { user: true, cohort: true } }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Enrollments"
        title="Place students in cohorts"
        description="Enroll or remove students from cohorts. Owners invoice tuition from Financials after placement."
      />
      <Section className="bg-[var(--eui-surface)]">
        <form
          action={enrollStudent}
          className="mb-8 grid gap-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4 md:grid-cols-3"
        >
          <div>
            <Label htmlFor="cohortId">Cohort</Label>
            <select
              id="cohortId"
              name="cohortId"
              required
              className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.program.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="userId">Student</Label>
            <select
              id="userId"
              name="userId"
              required
              className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              disabled={!students.length || !cohorts.length}
            >
              Enroll
            </Button>
          </div>
        </form>

        <form
          action={createDemoStudent}
          className="mb-10 grid gap-3 rounded-lg border border-dashed border-[var(--eui-border)] p-4 md:grid-cols-4"
        >
          <h3 className="md:col-span-4 text-sm font-semibold">Add student account</h3>
          <Input name="firstName" placeholder="First name" className="bg-[var(--eui-surface)]" />
          <Input name="lastName" placeholder="Last name" className="bg-[var(--eui-surface)]" />
          <Input name="email" type="email" placeholder="Email" required className="bg-[var(--eui-surface)]" />
          <Input
            name="password"
            placeholder="Password (default student123)"
            className="bg-[var(--eui-surface)]"
          />
          <div className="md:col-span-4">
            <Button type="submit" variant="secondary">
              Create student
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-[var(--eui-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-[var(--eui-ink-muted)]"
                  >
                    No enrollments yet.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {[e.user.firstName, e.user.lastName]
                        .filter(Boolean)
                        .join(" ") || e.user.email}
                    </TableCell>
                    <TableCell>{e.cohort.name}</TableCell>
                    <TableCell>{e.status}</TableCell>
                    <TableCell className="text-right">
                      <form action={unenrollStudent} className="inline">
                        <input
                          type="hidden"
                          name="enrollmentId"
                          value={e.id}
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Unenroll
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Section>
    </>
  );
}
