import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { school } from "../src/lib/school";
import {
  assessmentQuestions,
  assessments,
  cohorts,
  courses,
  enrollments,
  gradeCategories,
  invoiceLines,
  invoices,
  lessons,
  modules,
  operatingExpenses,
  payments,
  programs,
  users,
} from "../src/db/schema";

config({ path: ".env.local" });
config();

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

const diplomaCourses = [
  {
    code: "DMS-101",
    title: "Acoustic Physics & Instrumentation",
    description:
      "Foundations of ultrasound physics, transducers, image optimization, and instrumentation.",
    modules: [
      {
        title: "Wave Properties",
        lessons: [
          {
            title: "Sound waves and propagation",
            content:
              "Review frequency, wavelength, propagation speed, and how soft tissue assumptions affect imaging.",
          },
          {
            title: "Attenuation and absorption",
            content:
              "Understand attenuation mechanisms and their impact on penetration and image quality.",
          },
        ],
      },
      {
        title: "Transducers & Beam Formation",
        lessons: [
          {
            title: "Transducer construction",
            content:
              "Piezoelectric elements, matching layers, damping, and array types used in clinical practice.",
          },
        ],
      },
    ],
  },
  {
    code: "DMS-110",
    title: "Cross-Sectional Anatomy",
    description:
      "Sonographic anatomy correlations across abdominal and pelvic planes.",
    modules: [
      {
        title: "Abdominal Planes",
        lessons: [
          {
            title: "Liver and biliary landmarks",
            content:
              "Identify Couinaud segments, portal triad relationships, and common biliary landmarks.",
          },
        ],
      },
    ],
  },
  {
    code: "DMS-201",
    title: "Abdominal Sonography",
    description:
      "Protocol-driven abdominal scanning with pathology recognition.",
    modules: [
      {
        title: "Liver Protocols",
        lessons: [
          {
            title: "Standard liver survey",
            content:
              "Complete a systematic liver survey including vascular landmarks and documentation standards.",
          },
          {
            title: "Focal liver lesions overview",
            content:
              "Differentiate common benign and malignant appearance patterns at a student level.",
          },
        ],
      },
    ],
  },
  {
    code: "DMS-210",
    title: "OB/GYN Sonography",
    description: "Obstetric and gynecologic imaging across trimesters.",
    modules: [
      {
        title: "First Trimester",
        lessons: [
          {
            title: "Dating and viability",
            content:
              "CRL measurement, yolk sac, gestational sac, and viability criteria.",
          },
        ],
      },
    ],
  },
  {
    code: "DMS-220",
    title: "Vascular Sonography",
    description: "Arterial and venous duplex concepts for sonographers.",
    modules: [
      {
        title: "Carotid Duplex Basics",
        lessons: [
          {
            title: "Waveform recognition",
            content:
              "Identify normal vs abnormal carotid spectral waveforms and plaque characterization basics.",
          },
        ],
      },
    ],
  },
  {
    code: "DMS-130",
    title: "Patient Care, Ethics & Terminology",
    description:
      "Professionalism, medical terminology, patient care, and records management.",
    modules: [
      {
        title: "Professional Practice",
        lessons: [
          {
            title: "Ethics and patient communication",
            content:
              "Apply professional etiquette, informed consent basics, and clear patient communication.",
          },
        ],
      },
    ],
  },
];

async function upsertUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "owner" | "dean" | "instructor" | "student";
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    })
    .returning();
  return created.id;
}

async function main() {
  console.log("Seeding portal users + diploma content...");

  const ownerId = await upsertUser({
    email: "owner@excelsior.local",
    password: "owner123",
    firstName: "Andrew",
    lastName: "Thompson",
    role: "owner",
  });
  const deanId = await upsertUser({
    email: "dean@excelsior.local",
    password: "dean123",
    firstName: "Maya",
    lastName: "Reyes",
    role: "dean",
  });
  const instructorId = await upsertUser({
    email: "instructor@excelsior.local",
    password: "teach123",
    firstName: "Jordan",
    lastName: "Lee",
    role: "instructor",
  });
  const studentId = await upsertUser({
    email: "student@excelsior.local",
    password: "student123",
    firstName: "Alex",
    lastName: "Nguyen",
    role: "student",
  });

  void deanId;
  void instructorId;

  let program = await db.query.programs.findFirst({
    where: eq(programs.slug, "dms-diploma"),
  });

  if (!program) {
    const [created] = await db
      .insert(programs)
      .values({
        name: "Diagnostic Medical Sonography Diploma",
        slug: "dms-diploma",
        description:
          "18-month Technical Diploma covering abdominal, OB/GYN, vascular, physics, anatomy, and patient care.",
        durationMonths: 18,
        status: "active",
        tuitionAmount: String(school.program.tuition),
        registrationFee: String(school.program.registrationFee),
        uniformFee: String(school.program.uniformFee),
      })
      .returning();
    program = created;

    for (const [index, courseDef] of diplomaCourses.entries()) {
      const [course] = await db
        .insert(courses)
        .values({
          programId: program.id,
          code: courseDef.code,
          title: courseDef.title,
          description: courseDef.description,
          sortOrder: index,
          isPublished: true,
        })
        .returning();

      const [quizzes] = await db
        .insert(gradeCategories)
        .values({
          courseId: course.id,
          name: "Quizzes",
          weight: "30",
          sortOrder: 0,
        })
        .returning();

      await db.insert(gradeCategories).values([
        { courseId: course.id, name: "Exams", weight: "50", sortOrder: 1 },
        {
          courseId: course.id,
          name: "Participation",
          weight: "20",
          sortOrder: 2,
        },
      ]);

      for (const [mIndex, moduleDef] of courseDef.modules.entries()) {
        const [mod] = await db
          .insert(modules)
          .values({
            courseId: course.id,
            title: moduleDef.title,
            sortOrder: mIndex,
            isPublished: true,
          })
          .returning();

        for (const [lIndex, lessonDef] of moduleDef.lessons.entries()) {
          await db.insert(lessons).values({
            moduleId: mod.id,
            title: lessonDef.title,
            content: lessonDef.content,
            type: "text",
            sortOrder: lIndex,
            isPublished: true,
            estimatedMinutes: 20,
          });
        }
      }

      const [quiz] = await db
        .insert(assessments)
        .values({
          courseId: course.id,
          gradeCategoryId: quizzes.id,
          title: `${courseDef.code} Module Check`,
          description: "Short knowledge check covering introductory material.",
          type: "quiz",
          maxAttempts: 2,
          isPublished: true,
          isLocked: false,
          pointsPossible: "10",
        })
        .returning();

      await db.insert(assessmentQuestions).values([
        {
          assessmentId: quiz.id,
          type: "multiple_choice",
          prompt: `Which statement best reflects the focus of ${courseDef.title}?`,
          options: [
            "Protocol-driven clinical sonography knowledge",
            "Unrelated pharmacy compounding",
            "Veterinary radiography only",
            "Hospital billing codes exclusively",
          ],
          correctAnswer: "Protocol-driven clinical sonography knowledge",
          points: "5",
          sortOrder: 0,
        },
        {
          assessmentId: quiz.id,
          type: "true_false",
          prompt:
            "Excelsior emphasizes clinical experience throughout training.",
          options: ["True", "False"],
          correctAnswer: true,
          points: "5",
          sortOrder: 1,
        },
      ]);
    }

    const prepExists = await db.query.programs.findFirst({
      where: eq(programs.slug, "ardms-abdominal-prep"),
    });
    if (!prepExists) {
      const [prep] = await db
        .insert(programs)
        .values({
          name: "ARDMS Abdominal Prep",
          slug: "ardms-abdominal-prep",
          description: "Short specialty prep course using the same school engine.",
          durationMonths: 2,
          status: "active",
          tuitionAmount: "1200",
          registrationFee: "50",
          uniformFee: "0",
        })
        .returning();

      const [prepCourse] = await db
        .insert(courses)
        .values({
          programId: prep.id,
          code: "ARDMS-ABD",
          title: "Abdominal Registry Review",
          description: "Focused review for abdominal specialty exam prep.",
          sortOrder: 0,
          isPublished: true,
        })
        .returning();

      const [mod] = await db
        .insert(modules)
        .values({
          courseId: prepCourse.id,
          title: "High-Yield Abdominal Review",
          sortOrder: 0,
          isPublished: true,
        })
        .returning();

      await db.insert(lessons).values({
        moduleId: mod.id,
        title: "Rapid abdominal pathology review",
        content:
          "Condensed pathology patterns commonly tested on abdominal specialty exams.",
        type: "text",
        sortOrder: 0,
        isPublished: true,
      });
    }
  }

  let cohort = await db.query.cohorts.findFirst({
    where: eq(cohorts.name, "Cohort 2026A"),
  });
  if (!cohort) {
    const [created] = await db
      .insert(cohorts)
      .values({
        programId: program.id,
        name: "Cohort 2026A",
        maxStudents: 20,
        status: "active",
        startDate: new Date("2026-09-01T12:00:00Z"),
        endDate: new Date("2028-03-01T12:00:00Z"),
      })
      .returning();
    cohort = created;
  }

  await db
    .update(programs)
    .set({
      tuitionAmount: String(school.program.tuition),
      registrationFee: String(school.program.registrationFee),
      uniformFee: String(school.program.uniformFee),
      updatedAt: new Date(),
    })
    .where(eq(programs.id, program.id));

  await db
    .update(programs)
    .set({
      tuitionAmount: "1200",
      registrationFee: "50",
      uniformFee: "0",
      updatedAt: new Date(),
    })
    .where(eq(programs.slug, "ardms-abdominal-prep"));

  const enrollment = await db.query.enrollments.findFirst({
    where: eq(enrollments.userId, studentId),
  });
  let enrollmentId = enrollment?.id;
  if (!enrollmentId) {
    const [createdEnrollment] = await db
      .insert(enrollments)
      .values({ userId: studentId, cohortId: cohort.id, status: "active" })
      .returning();
    enrollmentId = createdEnrollment.id;
  }

  const existingInvoice = await db.query.invoices.findFirst({
    where: eq(invoices.number, "INV-2026-0001"),
  });
  if (!existingInvoice) {
    const [invoice] = await db
      .insert(invoices)
      .values({
        number: "INV-2026-0001",
        userId: studentId,
        enrollmentId,
        status: "partial",
        issuedAt: new Date("2026-08-01T12:00:00Z"),
        dueAt: new Date("2026-09-15T17:00:00Z"),
        notes: "Diploma tuition package — Cohort 2026A",
        createdById: ownerId,
      })
      .returning();

    await db.insert(invoiceLines).values([
      {
        invoiceId: invoice.id,
        description: "Program tuition",
        amount: String(school.program.tuition),
        sortOrder: 0,
      },
      {
        invoiceId: invoice.id,
        description: "Registration fee",
        amount: String(school.program.registrationFee),
        sortOrder: 1,
      },
      {
        invoiceId: invoice.id,
        description: "Uniform fee",
        amount: String(school.program.uniformFee),
        sortOrder: 2,
      },
    ]);

    await db.insert(payments).values([
      {
        invoiceId: invoice.id,
        amount: "5000",
        method: "ach",
        reference: "ACH-88421",
        paidAt: new Date("2026-08-05T15:00:00Z"),
        recordedById: ownerId,
        notes: "Initial deposit",
      },
      {
        invoiceId: invoice.id,
        amount: "2500",
        method: "check",
        reference: "CHK-1042",
        paidAt: new Date("2026-08-20T15:00:00Z"),
        recordedById: ownerId,
      },
    ]);
  }

  const expenseCount = await db.query.operatingExpenses.findMany({ limit: 1 });
  if (expenseCount.length === 0) {
    await db.insert(operatingExpenses).values([
      {
        category: "facility",
        description: "Suite 206 monthly rent",
        vendor: "Colonial Professional Center",
        amount: "4200",
        incurredAt: new Date("2026-08-01T12:00:00Z"),
        recordedById: ownerId,
      },
      {
        category: "payroll",
        description: "Instructor stipends — August",
        vendor: "Excelsior payroll",
        amount: "9800",
        incurredAt: new Date("2026-08-15T12:00:00Z"),
        recordedById: ownerId,
      },
      {
        category: "equipment",
        description: "Ultrasound phantom replacement kit",
        vendor: "Clinical Imaging Supply",
        amount: "1650",
        incurredAt: new Date("2026-08-12T12:00:00Z"),
        recordedById: ownerId,
      },
      {
        category: "insurance",
        description: "Liability insurance installment",
        vendor: "Florida Educators Mutual",
        amount: "1100",
        incurredAt: new Date("2026-08-08T12:00:00Z"),
        recordedById: ownerId,
      },
    ]);
  }

  console.log("Seed complete.");
  console.log("Demo logins:");
  console.log("  owner@excelsior.local / owner123");
  console.log("  dean@excelsior.local / dean123");
  console.log("  instructor@excelsior.local / teach123");
  console.log("  student@excelsior.local / student123");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
