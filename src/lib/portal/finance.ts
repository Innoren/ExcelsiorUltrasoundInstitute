import { desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  invoices,
  operatingExpenses,
  payments,
  type ExpenseCategory,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/db/schema";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  partial: "Partial",
  paid: "Paid",
  void: "Void",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  check: "Check",
  ach: "ACH / bank",
  card: "Card",
  other: "Other",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  payroll: "Payroll",
  facility: "Facility",
  equipment: "Equipment",
  supplies: "Supplies",
  marketing: "Marketing",
  insurance: "Insurance",
  software: "Software",
  other: "Other",
};

export function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function moneyExact(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function parseMoney(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (!raw) return 0;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid amount");
  }
  return Math.round(amount * 100) / 100;
}

export function sumAmounts(values: Array<string | number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + Number(value ?? 0), 0);
}

export function invoiceBalance(input: {
  lines: Array<{ amount: string | number }>;
  payments: Array<{ amount: string | number }>;
  status: InvoiceStatus;
}): { total: number; paid: number; balance: number } {
  const total = sumAmounts(input.lines.map((line) => line.amount));
  const paid =
    input.status === "void"
      ? 0
      : sumAmounts(input.payments.map((payment) => payment.amount));
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100);
  return { total, paid, balance };
}

export function deriveInvoiceStatus(
  current: InvoiceStatus,
  total: number,
  paid: number,
): InvoiceStatus {
  if (current === "void" || current === "draft") return current;
  if (paid <= 0) return "open";
  if (paid + 0.001 >= total) return "paid";
  return "partial";
}

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await db.query.invoices.findFirst({
    where: (row, { like }) => like(row.number, `${prefix}%`),
    orderBy: [desc(invoices.number)],
  });
  const next = latest
    ? Number(latest.number.slice(prefix.length)) + 1
    : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function getFinanceSummary() {
  const [invoiceRows, expenseRows, paymentTotalRow, expenseTotalRow] =
    await Promise.all([
      db.query.invoices.findMany({
        with: { lines: true, payments: true, user: true },
        orderBy: [desc(invoices.issuedAt)],
      }),
      db.query.operatingExpenses.findMany({
        orderBy: [desc(operatingExpenses.incurredAt)],
      }),
      db
        .select({
          total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
        })
        .from(payments)
        .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
        .where(ne(invoices.status, "void")),
      db
        .select({
          total: sql<string>`coalesce(sum(${operatingExpenses.amount}), 0)`,
        })
        .from(operatingExpenses),
    ]);

  const activeInvoices = invoiceRows.filter((row) => row.status !== "void");
  let billed = 0;
  let collected = 0;
  let outstanding = 0;
  let overdue = 0;
  const now = Date.now();

  for (const invoice of activeInvoices) {
    const { total, paid, balance } = invoiceBalance(invoice);
    billed += total;
    collected += paid;
    outstanding += balance;
    if (
      balance > 0 &&
      invoice.dueAt &&
      invoice.dueAt.getTime() < now &&
      invoice.status !== "draft"
    ) {
      overdue += balance;
    }
  }

  const expenses = Number(expenseTotalRow[0]?.total ?? 0);
  const net = collected - expenses;

  const recentPayments = await db.query.payments.findMany({
    with: {
      invoice: { with: { user: true } },
    },
    orderBy: [desc(payments.paidAt)],
    limit: 8,
  });

  const payableInvoices = activeInvoices
    .map((invoice) => {
      const balances = invoiceBalance(invoice);
      return { ...invoice, ...balances };
    })
    .filter((invoice) => invoice.balance > 0);

  const expensesByCategory = (
    Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
  ).map((category) => ({
    category,
    label: EXPENSE_CATEGORY_LABELS[category],
    total: sumAmounts(
      expenseRows
        .filter((row) => row.category === category)
        .map((row) => row.amount),
    ),
  }));

  return {
    billed,
    collected,
    outstanding,
    overdue,
    expenses,
    net,
    paymentCount: recentPayments.length,
    invoiceCount: activeInvoices.length,
    openInvoiceCount: payableInvoices.length,
    recentPayments,
    openInvoices: payableInvoices.slice(0, 8),
    payableInvoices,
    expensesByCategory: expensesByCategory.filter((row) => row.total > 0),
    recentExpenses: expenseRows.slice(0, 8),
    collectedRaw: Number(paymentTotalRow[0]?.total ?? collected),
  };
}

export async function refreshInvoiceStatus(invoiceId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { lines: true, payments: true },
  });
  if (!invoice) return;
  const { total, paid } = invoiceBalance(invoice);
  const status = deriveInvoiceStatus(invoice.status, total, paid);
  if (status !== invoice.status) {
    await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }
}

export async function getInvoiceDetail(invoiceId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: {
      user: true,
      enrollment: { with: { cohort: { with: { program: true } } } },
      lines: true,
      payments: true,
    },
  });
  if (!invoice) return null;
  return {
    ...invoice,
    lines: [...invoice.lines].sort((a, b) => a.sortOrder - b.sortOrder),
    payments: [...invoice.payments].sort(
      (a, b) => b.paidAt.getTime() - a.paidAt.getTime(),
    ),
  };
}
