import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { submitAssessment } from "@/app/actions/learn";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import {
  assessmentAttempts,
  assessmentQuestions,
  assessments,
} from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const user = await requireUser(["student", "owner", "dean", "instructor"]);

  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
  });
  if (!assessment) notFound();

  const questions = await db.query.assessmentQuestions.findMany({
    where: eq(assessmentQuestions.assessmentId, assessmentId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  });
  const attempts = await db.query.assessmentAttempts.findMany({
    where: and(
      eq(assessmentAttempts.assessmentId, assessmentId),
      eq(assessmentAttempts.userId, user.id),
    ),
    orderBy: [desc(assessmentAttempts.startedAt)],
  });
  const remaining = (assessment.maxAttempts ?? 1) - attempts.length;
  const canTake = user.role === "student";

  return (
    <>
      <PageHero
        eyebrow={assessment.type}
        title={assessment.title}
        description={assessment.description ?? "Assessment"}
      />
      <Section className="bg-[var(--eui-surface)]">
        <p className="mb-4 text-sm">
          <Link
            href={`/learn/courses/${assessment.courseId}`}
            className="text-[var(--eui-teal)] hover:underline"
          >
            Back to course
          </Link>
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {assessment.type}
          </Badge>
          <Badge variant="outline">
            {attempts.length}/{assessment.maxAttempts ?? 1} attempts used
          </Badge>
          {assessment.isLocked ? (
            <Badge variant="destructive">Locked</Badge>
          ) : null}
        </div>

        {attempts.length > 0 ? (
          <div className="mb-6 rounded-lg border border-[var(--eui-border)] p-4">
            <h3 className="text-sm font-semibold">Your attempts</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {attempts.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className="capitalize text-[var(--eui-ink-muted)]">
                    {a.status}
                  </span>
                  <span>
                    {a.score != null ? `${Number(a.score).toFixed(0)}%` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!canTake ? (
          <p className="text-sm text-[var(--eui-ink-muted)]">
            Viewing as staff. Sign in as a student to submit.
          </p>
        ) : assessment.isLocked ? (
          <p className="text-sm text-[var(--eui-ink-muted)]">
            Locked — ask the Dean to unlock.
          </p>
        ) : remaining <= 0 ? (
          <p className="text-sm text-[var(--eui-ink-muted)]">
            No attempts remaining.
          </p>
        ) : (
          <form
            action={submitAssessment}
            className="space-y-6 rounded-lg border border-[var(--eui-border)] p-5"
          >
            <input type="hidden" name="assessmentId" value={assessmentId} />
            {questions.map((q, i) => (
              <fieldset key={q.id} className="space-y-2">
                <legend className="text-sm font-medium">
                  {i + 1}. {q.prompt}
                </legend>
                {q.type === "short_answer" ? (
                  <textarea
                    name={`q_${q.id}`}
                    required
                    className="min-h-24 w-full rounded-md border border-[var(--eui-border)] px-3 py-2 text-sm"
                  />
                ) : null}
                {(q.type === "multiple_choice" ||
                  q.type === "true_false" ||
                  q.type === "multi_select") &&
                  (q.options ?? []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type={q.type === "multi_select" ? "checkbox" : "radio"}
                        name={`q_${q.id}`}
                        value={
                          q.type === "true_false"
                            ? opt === "True"
                              ? "true"
                              : "false"
                            : opt
                        }
                        required={q.type !== "multi_select"}
                      />
                      {opt}
                    </label>
                  ))}
              </fieldset>
            ))}
            <Button
              type="submit"
              className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
            >
              Submit {assessment.type}
            </Button>
          </form>
        )}
      </Section>
    </>
  );
}
