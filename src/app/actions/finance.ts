"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/portal/auth";
import {
  deriveInvoiceStatus,
  invoiceBalance,
  nextInvoiceNumber,
  parseMoney,
  refreshInvoiceStatus,
} from "@/lib/portal/finance";
import { db } from "@/db";
import {
  auditLogs,
  enrollments,
  invoiceLines,
  invoices,
  operatingExpenses,
  payments,
  programs,
  type ExpenseCategory,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/db/schema";

async function audit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
  });
}

function revalidateFinance() {
  revalidatePath("/admin");
  revalidatePath("/admin/financials");
  revalidatePath("/admin/financials/invoices");
  revalidatePath("/admin/financials/expenses");
  revalidatePath("/admin/financials/tuition");
  revalidatePath("/campus/enrollments");
}

const PAYMENT_METHODS = new Set<PaymentMethod>([
  "cash",
  "check",
  "ach",
  "card",
  "other",
]);

const EXPENSE_CATEGORIES = new Set<ExpenseCategory>([
  "payroll",
  "facility",
  "equipment",
  "supplies",
  "marketing",
  "insurance",
  "software",
  "other",
]);

export async function updateProgramPricing(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const programId = String(formData.get("programId") ?? "");
  if (!programId) throw new Error("Program required");

  const tuitionAmount = String(parseMoney(formData.get("tuitionAmount")));
  const registrationFee = String(parseMoney(formData.get("registrationFee")));
  const uniformFee = String(parseMoney(formData.get("uniformFee")));

  await db
    .update(programs)
    .set({
      tuitionAmount,
      registrationFee,
      uniformFee,
      updatedAt: new Date(),
    })
    .where(eq(programs.id, programId));

  await audit(actor.id, "program.pricing.update", "program", programId);
  revalidateFinance();
}

export async function createTuitionInvoice(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const userId = String(formData.get("userId") ?? "");
  const enrollmentId = String(formData.get("enrollmentId") ?? "") || null;
  const dueRaw = String(formData.get("dueAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const includeTuition = formData.get("includeTuition") === "on";
  const includeRegistration = formData.get("includeRegistration") === "on";
  const includeUniform = formData.get("includeUniform") === "on";
  const customDescription = String(formData.get("customDescription") ?? "").trim();
  const customAmountRaw = String(formData.get("customAmount") ?? "").trim();

  if (!userId) throw new Error("Student required");

  let tuition = 0;
  let registration = 0;
  let uniform = 0;
  const resolvedEnrollmentId = enrollmentId;

  if (enrollmentId) {
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      with: { cohort: { with: { program: true } }, user: true },
    });
    if (!enrollment || enrollment.userId !== userId) {
      throw new Error("Enrollment does not match student");
    }
    const program = enrollment.cohort.program;
    tuition = Number(program.tuitionAmount);
    registration = Number(program.registrationFee);
    uniform = Number(program.uniformFee);
  }

  const lines: Array<{ description: string; amount: string; sortOrder: number }> =
    [];
  if (includeTuition && tuition > 0) {
    lines.push({
      description: "Program tuition",
      amount: String(tuition),
      sortOrder: 0,
    });
  }
  if (includeRegistration && registration > 0) {
    lines.push({
      description: "Registration fee",
      amount: String(registration),
      sortOrder: 1,
    });
  }
  if (includeUniform && uniform > 0) {
    lines.push({
      description: "Uniform fee",
      amount: String(uniform),
      sortOrder: 2,
    });
  }
  if (customDescription && customAmountRaw) {
    lines.push({
      description: customDescription,
      amount: String(parseMoney(customAmountRaw)),
      sortOrder: lines.length,
    });
  }

  if (lines.length === 0) {
    throw new Error("Add at least one invoice line");
  }

  const number = await nextInvoiceNumber();
  const dueAt = dueRaw ? new Date(`${dueRaw}T17:00:00`) : null;

  const [invoice] = await db
    .insert(invoices)
    .values({
      number,
      userId,
      enrollmentId: resolvedEnrollmentId,
      status: "open",
      dueAt,
      notes,
      createdById: actor.id,
    })
    .returning();

  await db.insert(invoiceLines).values(
    lines.map((line) => ({
      invoiceId: invoice.id,
      description: line.description,
      amount: line.amount,
      sortOrder: line.sortOrder,
    })),
  );

  await audit(actor.id, "invoice.create", "invoice", invoice.id);
  revalidateFinance();
}

export async function recordPayment(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const methodRaw = String(formData.get("method") ?? "other") as PaymentMethod;
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const paidRaw = String(formData.get("paidAt") ?? "");
  const amount = parseMoney(formData.get("amount"));

  if (!invoiceId || amount <= 0) throw new Error("Payment details required");
  if (!PAYMENT_METHODS.has(methodRaw)) throw new Error("Invalid method");

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { lines: true, payments: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") throw new Error("Cannot pay a void invoice");

  const { balance } = invoiceBalance(invoice);
  if (amount > balance + 0.001) {
    throw new Error("Payment exceeds remaining balance");
  }

  await db.insert(payments).values({
    invoiceId,
    amount: String(amount),
    method: methodRaw,
    reference,
    notes,
    paidAt: paidRaw ? new Date(`${paidRaw}T12:00:00`) : new Date(),
    recordedById: actor.id,
  });

  await refreshInvoiceStatus(invoiceId);
  await audit(actor.id, "payment.record", "invoice", invoiceId);
  revalidateFinance();
}

export async function voidInvoice(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) throw new Error("Invoice required");

  await db
    .update(invoices)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  await audit(actor.id, "invoice.void", "invoice", invoiceId);
  revalidateFinance();
}

export async function setInvoiceStatus(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const status = String(formData.get("status") ?? "") as InvoiceStatus;
  if (!invoiceId) throw new Error("Invoice required");
  if (!["draft", "open", "partial", "paid", "void"].includes(status)) {
    throw new Error("Invalid status");
  }

  let nextStatus = status;
  if (status === "partial" || status === "paid" || status === "open") {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: { lines: true, payments: true },
    });
    if (!invoice) throw new Error("Invoice not found");
    const { total, paid } = invoiceBalance(invoice);
    nextStatus = deriveInvoiceStatus("open", total, paid);
  }

  await db
    .update(invoices)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  await audit(actor.id, "invoice.status", "invoice", invoiceId);
  revalidateFinance();
}

export async function createExpense(formData: FormData) {
  const actor = await requireUser(["owner"]);
  const category = String(formData.get("category") ?? "other") as ExpenseCategory;
  const description = String(formData.get("description") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const incurredRaw = String(formData.get("incurredAt") ?? "");
  const amount = parseMoney(formData.get("amount"));

  if (!description || amount <= 0) throw new Error("Expense details required");
  if (!EXPENSE_CATEGORIES.has(category)) throw new Error("Invalid category");

  const [expense] = await db
    .insert(operatingExpenses)
    .values({
      category,
      description,
      vendor,
      notes,
      amount: String(amount),
      incurredAt: incurredRaw
        ? new Date(`${incurredRaw}T12:00:00`)
        : new Date(),
      recordedById: actor.id,
    })
    .returning();

  await audit(actor.id, "expense.create", "expense", expense.id);
  revalidateFinance();
}
