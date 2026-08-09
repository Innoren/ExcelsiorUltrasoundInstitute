import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/portal/auth";
import { homeForRole } from "@/lib/portal/rbac";
import { school } from "@/lib/school";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  const { error, next } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--eui-ink)] px-4 py-10 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.16),_transparent_55%),linear-gradient(165deg,#0b1f24_0%,#12363c_55%,#0f766e_140%)]"
      />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md md:p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          {school.shortName}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--eui-teal-glow)]">
          Ultrasound Institute
        </p>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Your courses, grades, and messages are inside the school portal.
          Sign in to open your dashboard.
        </p>

        <form action={loginAction} className="mt-8 space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          {error ? (
            <p className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-100">
              {error === "missing"
                ? "Enter email and password."
                : "Invalid email or password."}
            </p>
          ) : null}
          <div>
            <Label htmlFor="email" className="text-white/85">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1 border-white/20 bg-[var(--eui-surface)] text-[var(--eui-ink)]"
              placeholder="student@excelsior.local"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-white/85">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 border-white/20 bg-[var(--eui-surface)] text-[var(--eui-ink)]"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
          >
            Sign in
          </Button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/55">
          <p className="font-semibold text-white/75">Demo accounts</p>
          <ul className="mt-2 space-y-1">
            <li>student@excelsior.local / student123</li>
            <li>instructor@excelsior.local / teach123</li>
            <li>dean@excelsior.local / dean123</li>
            <li>owner@excelsior.local / owner123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
