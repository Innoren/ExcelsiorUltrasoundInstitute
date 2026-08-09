import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/portal/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { gradeEntries } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function LearnGradesPage() {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);
  const grades = await db.query.gradeEntries.findMany({
    where: eq(gradeEntries.userId, user.id),
    orderBy: [desc(gradeEntries.createdAt)],
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Grades"
        description="Scored quizzes, exams, and feedback across your courses."
      />
      <div className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => {
              const earned = Number(g.pointsEarned ?? 0);
              const possible = Number(g.pointsPossible);
              const pct =
                possible > 0 ? Math.round((earned / possible) * 100) : 0;
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.title}</TableCell>
                  <TableCell>
                    {g.pointsEarned == null
                      ? "Pending"
                      : `${earned}/${possible} (${pct}%)`}
                  </TableCell>
                  <TableCell className="text-[var(--eui-ink-muted)]">
                    {g.feedback ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {grades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-[var(--eui-ink-muted)]"
                >
                  No grades yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
