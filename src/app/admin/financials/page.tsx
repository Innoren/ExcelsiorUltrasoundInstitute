import Link from "next/link";
import { createExpense, recordPayment } from "@/app/actions/finance";
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
import type { ExpenseCategory, PaymentMethod } from "@/db/schema";
import {
  EXPENSE_CATEGORY_LABELS,
  getFinanceSummary,
  INVOICE_STATUS_LABELS,
  money,
  moneyExact,
  PAYMENT_METHOD_LABELS,
} from "@/lib/portal/finance";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminFinancialsPage() {
  await requireUser(["owner"]);
  const summary = await getFinanceSummary();
  const methods = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
  const categories = Object.keys(
    EXPENSE_CATEGORY_LABELS,
  ) as ExpenseCategory[];

  return (
    <>
      <PageHero
        eyebrow="Financials"
        title="School money at a glance"
        description="Log collections and expenses here, then review tuition billed, outstanding balances, and net cash."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Collected", money(summary.collected), "Payments received"],
            ["Outstanding", money(summary.outstanding), "Open student balances"],
            ["Overdue", money(summary.overdue), "Past due balances"],
            ["Billed", money(summary.billed), "Active invoice totals"],
            ["Expenses", money(summary.expenses), "Operating costs logged"],
            ["Net cash", money(summary.net), "Collected minus expenses"],
          ].map(([label, value, hint]) => (
            <div
              key={label as string}
              className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4"
            >
              <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--eui-teal)]">
                {value as string}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--eui-ink)]">
                {label as string}
              </p>
              <p className="text-xs text-[var(--eui-ink-muted)]">
                {hint as string}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <form
            action={recordPayment}
            className="space-y-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-5"
          >
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
                Record collected money
              </h2>
              <p className="text-sm text-[var(--eui-ink-muted)]">
                Apply a payment to an open student invoice.
              </p>
            </div>
            {summary.payableInvoices.length === 0 ? (
              <p className="text-sm text-[var(--eui-ink-muted)]">
                No open balances to collect against.{" "}
                <Link
                  href="/admin/financials/invoices"
                  className="text-[var(--eui-teal)] hover:underline"
                >
                  Create an invoice
                </Link>{" "}
                first.
              </p>
            ) : (
              <>
                <div>
                  <Label htmlFor="quick-invoiceId">Invoice</Label>
                  <select
                    id="quick-invoiceId"
                    name="invoiceId"
                    required
                    className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
                    defaultValue={summary.payableInvoices[0]?.id}
                  >
                    {summary.payableInvoices.map((invoice) => {
                      const student =
                        [invoice.user.firstName, invoice.user.lastName]
                          .filter(Boolean)
                          .join(" ") || invoice.user.email;
                      return (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.number} · {student} · due{" "}
                          {moneyExact(invoice.balance)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="quick-amount">Amount</Label>
                    <Input
                      id="quick-amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      defaultValue={summary.payableInvoices[0]?.balance}
                      className="mt-1 bg-[var(--eui-surface)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-method">Method</Label>
                    <select
                      id="quick-method"
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
                    <Label htmlFor="quick-paidAt">Paid on</Label>
                    <Input
                      id="quick-paidAt"
                      name="paidAt"
                      type="date"
                      className="mt-1 bg-[var(--eui-surface)]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quick-reference">Reference</Label>
                    <Input
                      id="quick-reference"
                      name="reference"
                      placeholder="Check # / confirmation"
                      className="mt-1 bg-[var(--eui-surface)]"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
                >
                  Save collection
                </Button>
              </>
            )}
          </form>

          <form
            action={createExpense}
            className="space-y-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-5"
          >
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
                Add expense
              </h2>
              <p className="text-sm text-[var(--eui-ink-muted)]">
                Log payroll, rent, equipment, and other operating spend.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="quick-category">Category</Label>
                <select
                  id="quick-category"
                  name="category"
                  required
                  className="mt-1 w-full rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-3 py-2 text-sm"
                  defaultValue="facility"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {EXPENSE_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="quick-expense-amount">Amount</Label>
                <Input
                  id="quick-expense-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="mt-1 bg-[var(--eui-surface)]"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="quick-description">Description</Label>
                <Input
                  id="quick-description"
                  name="description"
                  required
                  placeholder="Monthly rent — Suite 206"
                  className="mt-1 bg-[var(--eui-surface)]"
                />
              </div>
              <div>
                <Label htmlFor="quick-vendor">Vendor</Label>
                <Input
                  id="quick-vendor"
                  name="vendor"
                  placeholder="Optional"
                  className="mt-1 bg-[var(--eui-surface)]"
                />
              </div>
              <div>
                <Label htmlFor="quick-incurredAt">Date</Label>
                <Input
                  id="quick-incurredAt"
                  name="incurredAt"
                  type="date"
                  className="mt-1 bg-[var(--eui-surface)]"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
            >
              Save expense
            </Button>
          </form>
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/financials/invoices">Invoices & payments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/financials/expenses">All expenses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/financials/tuition">Tuition & fees</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              Open balances
            </h2>
            <div className="rounded-lg border border-[var(--eui-border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.openInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-[var(--eui-ink-muted)]"
                      >
                        No open balances.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.openInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link
                            href={`/admin/financials/invoices?focus=${invoice.id}`}
                            className="text-[var(--eui-teal)] hover:underline"
                          >
                            {invoice.number}
                          </Link>
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
              Recent payments
            </h2>
            <div className="rounded-lg border border-[var(--eui-border)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-[var(--eui-ink-muted)]"
                      >
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paidAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {[
                            payment.invoice.user.firstName,
                            payment.invoice.user.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || payment.invoice.user.email}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {summary.expensesByCategory.length > 0 ? (
          <div className="mt-10">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
              Spend by category
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {summary.expensesByCategory.map((row) => (
                <div
                  key={row.category}
                  className="rounded-lg border border-[var(--eui-border)] px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--eui-ink-muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--eui-ink)]">
                    {money(row.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
