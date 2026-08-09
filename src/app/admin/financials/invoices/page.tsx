import {
  createTuitionInvoice,
  recordPayment,
  voidInvoice,
} from "@/app/actions/finance";
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
import {
  INVOICE_STATUS_LABELS,
  invoiceBalance,
  money,
  moneyExact,
  PAYMENT_METHOD_LABELS,
} from "@/lib/portal/finance";
import { requireUser } from "@/lib/portal/auth";
import type { PaymentMethod } from "@/db/schema";
import { desc } from "drizzle-orm";
import { invoices } from "@/db/schema";

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  await requireUser(["owner"]);
  const { focus } = await searchParams;

  const [invoiceRows, students, enrollmentRows] = await Promise.all([
    db.query.invoices.findMany({
      with: {
        user: true,
        lines: true,
        payments: true,
        enrollment: { with: { cohort: { with: { program: true } } } },
      },
      orderBy: [desc(invoices.issuedAt)],
    }),
    db.query.users.findMany({
      where: (u, { eq }) => eq(u.role, "student"),
      orderBy: (u, { asc }) => [asc(u.lastName), asc(u.firstName)],
    }),
    db.query.enrollments.findMany({
      with: { user: true, cohort: { with: { program: true } } },
    }),
  ]);

  const methods = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
  const enriched = invoiceRows.map((invoice) => ({
    ...invoice,
    ...invoiceBalance(invoice),
  }));
  const focused = focus
    ? enriched.find((invoice) => invoice.id === focus)
    : enriched[0];

  return (
    <>
      <PageHero
        eyebrow="Invoices"
        title="Student billing"
        description="Create tuition invoices from program pricing, then record cash, check, ACH, or card payments."
      />
      <Section className="bg-[var(--eui-surface)]">
        <form
          action={createTuitionInvoice}
          className="mb-10 space-y-4 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-5"
        >
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              New invoice
            </h2>
            <p className="text-sm text-[var(--eui-ink-muted)]">
              Pull fees from an enrollment’s program, or add a custom line.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="userId">Student</Label>
              <select
                id="userId"
                name="userId"
                required
                className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {[student.firstName, student.lastName]
                      .filter(Boolean)
                      .join(" ") || student.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="enrollmentId">Enrollment (optional)</Label>
              <select
                id="enrollmentId"
                name="enrollmentId"
                className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">No enrollment link</option>
                {enrollmentRows.map((enrollment) => (
                  <option key={enrollment.id} value={enrollment.id}>
                    {[enrollment.user.firstName, enrollment.user.lastName]
                      .filter(Boolean)
                      .join(" ") || enrollment.user.email}{" "}
                    · {enrollment.cohort.name} (
                    {money(enrollment.cohort.program.tuitionAmount)} tuition)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueAt">Due date</Label>
              <Input
                id="dueAt"
                name="dueAt"
                type="date"
                className="mt-1 bg-[var(--eui-surface)]"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Optional"
                className="mt-1 bg-[var(--eui-surface)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--eui-ink)]">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includeTuition"
                defaultChecked
                className="size-4 accent-[var(--eui-teal)]"
              />
              Tuition
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includeRegistration"
                defaultChecked
                className="size-4 accent-[var(--eui-teal)]"
              />
              Registration
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="includeUniform"
                defaultChecked
                className="size-4 accent-[var(--eui-teal)]"
              />
              Uniform
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customDescription">Custom line</Label>
              <Input
                id="customDescription"
                name="customDescription"
                placeholder="Clinical lab fee"
                className="mt-1 bg-[var(--eui-surface)]"
              />
            </div>
            <div>
              <Label htmlFor="customAmount">Custom amount</Label>
              <Input
                id="customAmount"
                name="customAmount"
                type="number"
                min="0"
                step="0.01"
                className="mt-1 bg-[var(--eui-surface)]"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
          >
            Create invoice
          </Button>
        </form>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              All invoices
            </h2>
            <div className="rounded-lg border border-[var(--eui-border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enriched.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-[var(--eui-ink-muted)]"
                      >
                        No invoices yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enriched.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={
                          focused?.id === invoice.id
                            ? "bg-[var(--eui-teal-soft)]/40"
                            : undefined
                        }
                      >
                        <TableCell>
                          <a
                            href={`?focus=${invoice.id}`}
                            className="font-medium text-[var(--eui-teal)] hover:underline"
                          >
                            {invoice.number}
                          </a>
                        </TableCell>
                        <TableCell>
                          {[invoice.user.firstName, invoice.user.lastName]
                            .filter(Boolean)
                            .join(" ") || invoice.user.email}
                        </TableCell>
                        <TableCell>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(invoice.total)}
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

          <div className="space-y-4">
            {focused ? (
              <>
                <div className="rounded-lg border border-[var(--eui-border)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                    {focused.number}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
                    {[focused.user.firstName, focused.user.lastName]
                      .filter(Boolean)
                      .join(" ") || focused.user.email}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
                    {INVOICE_STATUS_LABELS[focused.status]} · issued{" "}
                    {focused.issuedAt.toLocaleDateString()}
                    {focused.dueAt
                      ? ` · due ${focused.dueAt.toLocaleDateString()}`
                      : ""}
                  </p>
                  {focused.enrollment ? (
                    <p className="mt-2 text-sm text-[var(--eui-ink-muted)]">
                      {focused.enrollment.cohort.name} ·{" "}
                      {focused.enrollment.cohort.program.name}
                    </p>
                  ) : null}
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-[var(--eui-ink-muted)]">Total</dt>
                      <dd className="font-medium">{moneyExact(focused.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--eui-ink-muted)]">Paid</dt>
                      <dd className="font-medium">{moneyExact(focused.paid)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--eui-ink-muted)]">Balance</dt>
                      <dd className="font-medium">
                        {moneyExact(focused.balance)}
                      </dd>
                    </div>
                  </dl>
                  <ul className="mt-4 space-y-1 border-t border-[var(--eui-border)] pt-3 text-sm">
                    {focused.lines.map((line) => (
                      <li
                        key={line.id}
                        className="flex justify-between gap-3 text-[var(--eui-ink)]"
                      >
                        <span>{line.description}</span>
                        <span>{moneyExact(line.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  {focused.payments.length > 0 ? (
                    <ul className="mt-3 space-y-1 border-t border-[var(--eui-border)] pt-3 text-sm text-[var(--eui-ink-muted)]">
                      {focused.payments.map((payment) => (
                        <li
                          key={payment.id}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {payment.paidAt.toLocaleDateString()} ·{" "}
                            {PAYMENT_METHOD_LABELS[payment.method]}
                            {payment.reference
                              ? ` · ${payment.reference}`
                              : ""}
                          </span>
                          <span className="text-[var(--eui-ink)]">
                            {moneyExact(payment.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {focused.status !== "void" && focused.balance > 0 ? (
                  <form
                    action={recordPayment}
                    className="space-y-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-5"
                  >
                    <h3 className="font-medium text-[var(--eui-ink)]">
                      Record payment
                    </h3>
                    <input type="hidden" name="invoiceId" value={focused.id} />
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={focused.balance}
                        defaultValue={focused.balance}
                        required
                        className="mt-1 bg-[var(--eui-surface)]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="method">Method</Label>
                      <select
                        id="method"
                        name="method"
                        className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
                        defaultValue="ach"
                      >
                        {methods.map((method) => (
                          <option key={method} value={method}>
                            {PAYMENT_METHOD_LABELS[method]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference</Label>
                      <Input
                        id="reference"
                        name="reference"
                        placeholder="Check # / confirmation"
                        className="mt-1 bg-[var(--eui-surface)]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paidAt">Paid on</Label>
                      <Input
                        id="paidAt"
                        name="paidAt"
                        type="date"
                        className="mt-1 bg-[var(--eui-surface)]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
                    >
                      Save payment
                    </Button>
                  </form>
                ) : null}

                {focused.status !== "void" ? (
                  <form action={voidInvoice}>
                    <input type="hidden" name="invoiceId" value={focused.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Void invoice
                    </Button>
                  </form>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-[var(--eui-ink-muted)]">
                Create an invoice to manage payments here.
              </p>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
