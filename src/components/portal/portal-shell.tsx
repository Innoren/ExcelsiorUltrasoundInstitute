"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SettingsMenu } from "@/components/portal/settings-menu";
import type { Role } from "@/db/schema";
import { globalNavForRole, isGlobalNavActive } from "@/lib/portal/global-nav";
import { homeForRole, ROLE_LABELS } from "@/lib/portal/rbac";
import { school } from "@/lib/school";
import { cn } from "@/lib/utils";

export type PortalShellUser = {
  role: Role;
  name: string;
  unreadCount?: number;
};

export function PortalShell({
  user,
  children,
}: {
  user: PortalShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = globalNavForRole(user.role);

  return (
    <div className="relative min-h-svh text-[var(--eui-ink)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_color-mix(in_srgb,var(--eui-teal-glow)_28%,transparent),_transparent_42%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,var(--eui-teal)_16%,transparent),_transparent_45%),linear-gradient(180deg,var(--eui-canvas)_0%,color-mix(in_srgb,var(--eui-sand)_70%,var(--eui-canvas))_48%,var(--eui-canvas)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--eui-ink) 8%, transparent) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-[var(--eui-border)]/80 bg-[color-mix(in_srgb,var(--eui-surface)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            href={homeForRole(user.role)}
            className="min-w-0"
            onClick={() => setOpen(false)}
          >
            <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--eui-ink)] md:text-2xl">
              {school.shortName}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--eui-teal)]">
              Learning studio
            </p>
          </Link>

          <nav
            aria-label="Portal"
            className="hidden items-center gap-1 md:flex"
          >
            {items.map((item) => {
              const active = isGlobalNavActive(pathname, item);
              const showBadge =
                item.label === "Inbox" && (user.unreadCount ?? 0) > 0;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--eui-ink)] text-[var(--eui-surface)]"
                      : "text-[var(--eui-ink-muted)] hover:bg-[var(--eui-surface)] hover:text-[var(--eui-ink)]",
                  )}
                >
                  {item.label}
                  {showBadge ? (
                    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-[var(--eui-teal-glow)] px-1 text-[10px] font-bold text-[var(--eui-ink)]">
                      {user.unreadCount! > 9 ? "9+" : user.unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                {ROLE_LABELS[user.role]}
              </p>
              <p className="max-w-[10rem] truncate text-sm text-[var(--eui-ink)]">
                {user.name}
              </p>
            </div>
            <SettingsMenu />
            <button
              type="button"
              className="rounded-md p-2 text-[var(--eui-ink)] md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-[var(--eui-border)] bg-[var(--eui-surface)] px-4 py-3 md:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
              {ROLE_LABELS[user.role]} · {user.name}
            </p>
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={`${item.href}-${item.label}-m`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm text-[var(--eui-ink)] hover:bg-[var(--eui-teal-soft)]"
                >
                  {item.label}
                  {item.label === "Inbox" && (user.unreadCount ?? 0) > 0
                    ? ` (${user.unreadCount})`
                    : ""}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="relative">{children}</main>
    </div>
  );
}
