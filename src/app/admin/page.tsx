import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import {
  getFinanceSummary,
  INVOICE_STATUS_LABELS,
  money,
} from "@/lib/portal/finance";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminHomePage() {
  await requireUser(["owner"]);
  const [programs, courses, cohorts, people, enrollments, summary] =
    await Promise.all([
      db.query.programs.findMany(),
      db.query.courses.findMany(),
      db.query.cohorts.findMany(),
      db.query.users.findMany(),
      db.query.enrollments.findMany(),
      getFinanceSummary(),
    ]);

  const students = people.filter((person) => person.role === "student").length;
  const staff = people.filter((person) => person.role !== "student").length;

  return (
    <>
      <PageHero
        eyebrow="Owner"
        title="School command center"
        description="Operations, people, and financials in one place — tuition, expenses, programs, and audit."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Collected", money(summary.collected)],
            ["Outstanding", money(summary.outstanding)],
            ["Net cash", money(summary.net)],
            ["Active students", students],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4"
            >
              <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--eui-teal)] md:text-4xl">
                {value as string | number}
              </p>
              <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
                {label as string}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Programs", programs.length],
            ["Courses", courses.length],
            ["Cohorts", cohorts.length],
            ["Enrollments", enrollments.length],
            ["Staff", staff],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--eui-ink)]">
                {value as number}
              </p>
              <p className="text-sm text-[var(--eui-ink-muted)]">
                {label as string}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
          >
            <Link href="/admin/financials">Financials</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/financials/invoices">Invoices</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">Users & roles</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/programs">Programs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/campus">Campus</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/audit">Audit</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              Open receivables
            </h2>
            <div className="rounded-lg border border-[var(--eui-border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.openInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-[var(--eui-ink-muted)]"
                      >
                        All caught up — no open balances.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.openInvoices.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link
                            href={`/admin/financials/invoices?focus=${invoice.id}`}
                            className="text-[var(--eui-teal)] hover:underline"
                          >
                            {invoice.number}
                          </Link>
                          <span className="ml-2 text-xs text-[var(--eui-ink-muted)]">
                            {INVOICE_STATUS_LABELS[invoice.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          {[invoice.user.firstName, invoice.user.lastName]
                            .filter(Boolean)
                            .join(" ") || invoice.user.email}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(invoice.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              Owner checklist
            </h2>
            <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-[var(--eui-ink-muted)]">
              <li>Confirm program pricing under Tuition & fees</li>
              <li>Invoice enrolled students and record payments</li>
              <li>Log operating expenses for a true net picture</li>
              <li>Keep cohorts at max 20 and roles assigned</li>
            </ol>
            <div className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4 text-sm text-[var(--eui-ink)]">
              <p className="font-medium">This month at a glance</p>
              <ul className="mt-2 space-y-1 text-[var(--eui-ink-muted)]">
                <li>Billed {money(summary.billed)}</li>
                <li>Overdue {money(summary.overdue)}</li>
                <li>Expenses {money(summary.expenses)}</li>
                <li>
                  {summary.openInvoiceCount} open invoice
                  {summary.openInvoiceCount === 1 ? "" : "s"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
