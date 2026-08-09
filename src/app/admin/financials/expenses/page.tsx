import { createExpense } from "@/app/actions/finance";
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
  EXPENSE_CATEGORY_LABELS,
  money,
  moneyExact,
} from "@/lib/portal/finance";
import { requireUser } from "@/lib/portal/auth";
import type { ExpenseCategory } from "@/db/schema";

export default async function AdminExpensesPage() {
  await requireUser(["owner"]);
  const expenses = await db.query.operatingExpenses.findMany({
    orderBy: (row, { desc }) => [desc(row.incurredAt)],
  });
  const total = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const categories = Object.keys(
    EXPENSE_CATEGORY_LABELS,
  ) as ExpenseCategory[];

  return (
    <>
      <PageHero
        eyebrow="Expenses"
        title="Operating costs"
        description="Track payroll, facility, equipment, and other spend against tuition collections."
      />
      <Section className="bg-[var(--eui-surface)]">
        <p className="mb-6 text-sm text-[var(--eui-ink-muted)]">
          Logged total:{" "}
          <span className="font-semibold text-[var(--eui-ink)]">
            {moneyExact(total)}
          </span>
        </p>

        <form
          action={createExpense}
          className="mb-8 grid gap-3 rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className="mt-1 bg-[var(--eui-surface)]"
            />
          </div>
          <div>
            <Label htmlFor="incurredAt">Date</Label>
            <Input
              id="incurredAt"
              name="incurredAt"
              type="date"
              className="mt-1 bg-[var(--eui-surface)]"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              required
              placeholder="Monthly rent — Suite 206"
              className="mt-1 bg-[var(--eui-surface)]"
            />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              name="vendor"
              placeholder="Optional"
              className="mt-1 bg-[var(--eui-surface)]"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
            >
              Add expense
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-[var(--eui-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[var(--eui-ink-muted)]">
                    No expenses logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {expense.incurredAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.vendor || "—"}</TableCell>
                    <TableCell className="text-right">
                      {money(expense.amount)}
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
