import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "owner",
  "dean",
  "instructor",
  "student",
]);

export const programStatusEnum = pgEnum("program_status", [
  "draft",
  "active",
  "archived",
]);

export const cohortStatusEnum = pgEnum("cohort_status", [
  "planned",
  "active",
  "completed",
  "archived",
]);

export const lessonTypeEnum = pgEnum("lesson_type", [
  "text",
  "video",
  "pdf",
  "embed",
]);

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "quiz",
  "exam",
  "assignment",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "multi_select",
  "true_false",
  "short_answer",
]);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress",
  "submitted",
  "graded",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "partial",
  "paid",
  "void",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "check",
  "ach",
  "card",
  "other",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "payroll",
  "facility",
  "equipment",
  "supplies",
  "marketing",
  "insurance",
  "software",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: roleEnum("role").notNull().default("student"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const programs = pgTable("programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  durationMonths: integer("duration_months").notNull().default(18),
  status: programStatusEnum("status").notNull().default("draft"),
  tuitionAmount: numeric("tuition_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  registrationFee: numeric("registration_fee", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  uniformFee: numeric("uniform_fee", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cohorts = pgTable("cohorts", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  maxStudents: integer("max_students").notNull().default(20),
  status: cohortStatusEnum("status").notNull().default("planned"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: lessonTypeEnum("type").notNull().default("text"),
  content: text("content"),
  videoUrl: text("video_url"),
  fileUrl: text("file_url"),
  embedUrl: text("embed_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").default(15),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: text("status").notNull().default("active"),
  },
  (t) => [uniqueIndex("enrollment_unique").on(t.userId, t.cohortId)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("lesson_progress_unique").on(t.userId, t.lessonId)],
);

export const gradeCategories = pgTable("grade_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").references(() => modules.id, {
    onDelete: "set null",
  }),
  gradeCategoryId: uuid("grade_category_id").references(
    () => gradeCategories.id,
    { onDelete: "set null" },
  ),
  title: text("title").notNull(),
  description: text("description"),
  type: assessmentTypeEnum("type").notNull().default("quiz"),
  timeLimitMinutes: integer("time_limit_minutes"),
  maxAttempts: integer("max_attempts").default(1),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  pointsPossible: numeric("points_possible", { precision: 8, scale: 2 })
    .notNull()
    .default("100"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assessmentQuestions = pgTable("assessment_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: jsonb("correct_answer").$type<string | string[] | boolean>(),
  points: numeric("points", { precision: 8, scale: 2 }).notNull().default("1"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: attemptStatusEnum("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: numeric("score", { precision: 8, scale: 2 }),
  pointsEarned: numeric("points_earned", { precision: 8, scale: 2 }),
  feedback: text("feedback"),
  gradedById: uuid("graded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const assessmentAnswers = pgTable("assessment_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => assessmentAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  answer: jsonb("answer").$type<string | string[] | boolean | null>(),
  isCorrect: boolean("is_correct"),
  pointsAwarded: numeric("points_awarded", { precision: 8, scale: 2 }),
  feedback: text("feedback"),
});

export const gradeEntries = pgTable("grade_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id").references(() => assessments.id, {
    onDelete: "set null",
  }),
  gradeCategoryId: uuid("grade_category_id").references(
    () => gradeCategories.id,
    { onDelete: "set null" },
  ),
  title: text("title").notNull(),
  pointsEarned: numeric("points_earned", { precision: 8, scale: 2 }),
  pointsPossible: numeric("points_possible", {
    precision: 8,
    scale: 2,
  }).notNull(),
  isExcused: boolean("is_excused").notNull().default(false),
  feedback: text("feedback"),
  gradedById: uuid("graded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  cohortId: uuid("cohort_id").references(() => cohorts.id, {
    onDelete: "cascade",
  }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const portalMessages = pgTable("portal_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "set null",
  }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: text("number").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, {
    onDelete: "set null",
  }),
  status: invoiceStatusEnum("status").notNull().default("open"),
  issuedAt: timestamp("issued_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  notes: text("notes"),
  createdById: uuid("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull().default("other"),
  reference: text("reference"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  recordedById: uuid("recorded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const operatingExpenses = pgTable("operating_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: expenseCategoryEnum("category").notNull().default("other"),
  description: text("description").notNull(),
  vendor: text("vendor"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  incurredAt: timestamp("incurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  notes: text("notes"),
  recordedById: uuid("recorded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  attempts: many(assessmentAttempts),
  sentMessages: many(portalMessages, { relationName: "sentMessages" }),
  receivedMessages: many(portalMessages, { relationName: "receivedMessages" }),
  invoices: many(invoices),
}));

export const portalMessagesRelations = relations(
  portalMessages,
  ({ one }) => ({
    sender: one(users, {
      fields: [portalMessages.senderId],
      references: [users.id],
      relationName: "sentMessages",
    }),
    recipient: one(users, {
      fields: [portalMessages.recipientId],
      references: [users.id],
      relationName: "receivedMessages",
    }),
    course: one(courses, {
      fields: [portalMessages.courseId],
      references: [courses.id],
    }),
  }),
);

export const programsRelations = relations(programs, ({ many }) => ({
  cohorts: many(cohorts),
  courses: many(courses),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  program: one(programs, {
    fields: [cohorts.programId],
    references: [programs.id],
  }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  cohort: one(cohorts, {
    fields: [enrollments.cohortId],
    references: [cohorts.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  enrollment: one(enrollments, {
    fields: [invoices.enrollmentId],
    references: [enrollments.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
  lines: many(invoiceLines),
  payments: many(payments),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  recordedBy: one(users, {
    fields: [payments.recordedById],
    references: [users.id],
  }),
}));

export const operatingExpensesRelations = relations(
  operatingExpenses,
  ({ one }) => ({
    recordedBy: one(users, {
      fields: [operatingExpenses.recordedById],
      references: [users.id],
    }),
  }),
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id],
  }),
  modules: many(modules),
  assessments: many(assessments),
  gradeCategories: many(gradeCategories),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(lessonProgress),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assessments.courseId],
    references: [courses.id],
  }),
  questions: many(assessmentQuestions),
}));

export const assessmentQuestionsRelations = relations(
  assessmentQuestions,
  ({ one }) => ({
    assessment: one(assessments, {
      fields: [assessmentQuestions.assessmentId],
      references: [assessments.id],
    }),
  }),
);

export type Role = (typeof roleEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type ExpenseCategory = (typeof expenseCategoryEnum.enumValues)[number];
