import { updateUserRole } from "@/app/actions/manage";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { ROLE_LABELS } from "@/lib/portal/rbac";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminUsersPage() {
  await requireUser(["owner"]);
  const people = await db.query.users.findMany();

  return (
    <>
      <PageHero
        eyebrow="Users"
        title="Users & roles"
        description="Assign Owner, Dean, Instructor, or Student. Roles are enforced on every portal action."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="rounded-lg border border-[var(--eui-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    {[person.firstName, person.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{ROLE_LABELS[person.role]}</TableCell>
                  <TableCell>
                    <form action={updateUserRole} className="flex gap-2">
                      <input type="hidden" name="userId" value={person.id} />
                      <select
                        name="role"
                        defaultValue={person.role}
                        className="rounded-md border border-[var(--eui-border)] px-2 py-1 text-sm"
                      >
                        <option value="owner">Owner</option>
                        <option value="dean">Dean</option>
                        <option value="instructor">Instructor</option>
                        <option value="student">Student</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>
    </>
  );
}
