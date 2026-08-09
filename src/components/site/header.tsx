"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/app/actions/portal";
import type { Role } from "@/db/schema";
import { portalLinksByRole } from "@/lib/portal/nav";
import { homeForRole, ROLE_LABELS } from "@/lib/portal/rbac";
import { navLinks, school } from "@/lib/school";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type HeaderPortal = {
  role: Role;
  name: string;
};

const WORKSPACE_ROOTS = ["/learn", "/teach", "/campus", "/admin"] as const;

function isPortalWorkspace(pathname: string) {
  return WORKSPACE_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function isActivePortalLink(pathname: string, href: string) {
  if (pathname === href) return true;
  if (WORKSPACE_ROOTS.includes(href as (typeof WORKSPACE_ROOTS)[number])) {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export function SiteHeader({ portal }: { portal?: HeaderPortal | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const portalLinks = portal ? portalLinksByRole[portal.role] : [];
  const inWorkspace = Boolean(portal && isPortalWorkspace(pathname));
  const publicLinks = inWorkspace
    ? []
    : navLinks.filter((link) => link.href !== "/portal" || !portal);
  const brandHref = portal ? homeForRole(portal.role) : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--eui-ink)]/95 text-white backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 md:px-6">
        <Link
          href={brandHref}
          className="group min-w-0 shrink-0"
          onClick={() => setOpen(false)}
        >
          <p className="font-[family-name:var(--font-display)] text-lg leading-none tracking-tight md:text-xl">
            {school.shortName}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--eui-teal-glow)]">
            Ultrasound Institute
          </p>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 xl:flex">
          {publicLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {portal ? (
            <>
              {!inWorkspace ? (
                <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />
              ) : null}
              <span className="rounded-md bg-[var(--eui-teal)]/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--eui-teal-glow)]">
                {ROLE_LABELS[portal.role]}
              </span>
              <span className="max-w-[9rem] truncate text-sm text-white/70">
                {portal.name}
              </span>
              {portalLinks.map((link) => {
                const active = isActivePortalLink(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/75 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {inWorkspace ? (
                <Link
                  href="/"
                  className="rounded-md px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                >
                  School site
                </Link>
              ) : null}
              <form action={logoutAction}>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="ml-1 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="ml-2 bg-[var(--eui-teal)] text-white hover:bg-[var(--eui-teal-deep)]"
            >
              <Link href="/portal">School portal</Link>
            </Button>
          )}
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-white xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[var(--eui-ink)] px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm text-white/85 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}

            {portal ? (
              <>
                <div className="my-2 border-t border-white/10 pt-3">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal-glow)]">
                    {ROLE_LABELS[portal.role]} · {portal.name}
                  </p>
                </div>
                {portalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-sm text-white/85 hover:bg-white/5"
                  >
                    {link.label}
                  </Link>
                ))}
                {inWorkspace ? (
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-sm text-white/85 hover:bg-white/5"
                  >
                    School site
                  </Link>
                ) : null}
                <form action={logoutAction} className="mt-2">
                  <Button
                    type="submit"
                    className="w-full border-white/25 bg-transparent text-white hover:bg-white/10"
                    variant="outline"
                  >
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <Button
                asChild
                className="mt-2 bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              >
                <Link href="/portal" onClick={() => setOpen(false)}>
                  School portal
                </Link>
              </Button>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
