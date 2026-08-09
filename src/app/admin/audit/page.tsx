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
import { auditLogs } from "@/db/schema";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminAuditPage() {
  await requireUser(["owner"]);
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 100,
  });

  return (
    <>
      <PageHero
        eyebrow="Audit"
        title="Audit log"
        description="Server-side record of sensitive school-management actions."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="rounded-lg border border-[var(--eui-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {log.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-[var(--eui-ink-muted)]">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-[var(--eui-ink-muted)]"
                  >
                    No audit events yet.
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
