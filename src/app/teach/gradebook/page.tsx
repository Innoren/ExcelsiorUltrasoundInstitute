import { desc } from "drizzle-orm";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
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

export default async function TeachGradebookPage() {
  await requireUser(["instructor", "owner", "dean"]);
  const grades = await db.query.gradeEntries.findMany({
    orderBy: [desc(gradeEntries.createdAt)],
    limit: 100,
  });
  const userIds = [...new Set(grades.map((g) => g.userId))];
  const people =
    userIds.length > 0
      ? await db.query.users.findMany({
          where: (u, { inArray }) => inArray(u.id, userIds),
        })
      : [];
  const names = new Map(
    people.map((p) => [
      p.id,
      [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email,
    ]),
  );

  return (
    <>
      <PageHero
        eyebrow="Gradebook"
        title="Recent grade entries"
        description="Auto-scored quizzes and pending short-answer work across courses."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="rounded-lg border border-[var(--eui-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{names.get(g.userId) ?? "Student"}</TableCell>
                  <TableCell>{g.title}</TableCell>
                  <TableCell>
                    {g.pointsEarned == null
                      ? "Pending"
                      : `${g.pointsEarned}/${g.pointsPossible}`}
                  </TableCell>
                </TableRow>
              ))}
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
      </Section>
    </>
  );
}
