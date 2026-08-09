import {
  updateProgramPricing,
} from "@/app/actions/finance";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { moneyExact } from "@/lib/portal/finance";
import { requireUser } from "@/lib/portal/auth";

export default async function AdminTuitionPage() {
  await requireUser(["owner"]);
  const programList = await db.query.programs.findMany({
    orderBy: (row, { asc }) => [asc(row.name)],
  });

  return (
    <>
      <PageHero
        eyebrow="Tuition & fees"
        title="Program pricing"
        description="Set tuition, registration, and uniform fees used when you invoice an enrollment."
      />
      <Section className="bg-[var(--eui-surface)]">
        <div className="space-y-6">
          {programList.map((program) => {
            const packageTotal =
              Number(program.tuitionAmount) +
              Number(program.registrationFee) +
              Number(program.uniformFee);
            return (
              <form
                key={program.id}
                action={updateProgramPricing}
                className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-5"
              >
                <input type="hidden" name="programId" value={program.id} />
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
                      {program.name}
                    </h2>
                    <p className="text-sm text-[var(--eui-ink-muted)]">
                      Package total {moneyExact(packageTotal)} ·{" "}
                      {program.durationMonths} months · {program.status}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
                  >
                    Save pricing
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor={`tuition-${program.id}`}>Tuition</Label>
                    <Input
                      id={`tuition-${program.id}`}
                      name="tuitionAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={Number(program.tuitionAmount)}
                      className="mt-1 bg-[var(--eui-surface)]"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`reg-${program.id}`}>Registration fee</Label>
                    <Input
                      id={`reg-${program.id}`}
                      name="registrationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={Number(program.registrationFee)}
                      className="mt-1 bg-[var(--eui-surface)]"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`uniform-${program.id}`}>Uniform fee</Label>
                    <Input
                      id={`uniform-${program.id}`}
                      name="uniformFee"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={Number(program.uniformFee)}
                      className="mt-1 bg-[var(--eui-surface)]"
                      required
                    />
                  </div>
                </div>
              </form>
            );
          })}
          {programList.length === 0 ? (
            <p className="text-sm text-[var(--eui-ink-muted)]">
              Create a program first, then set pricing here.
            </p>
          ) : null}
        </div>
      </Section>
    </>
  );
}
