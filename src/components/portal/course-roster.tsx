"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LayoutGrid, List, Star } from "lucide-react";
import { useCourseFavorites } from "@/components/portal/course-favorites-provider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type CourseRosterItem = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  href: string;
  percent: number;
};

type ViewMode = "list" | "grid";

const STORAGE_KEY = "eui-course-view";

let viewEpoch = 0;
const viewListeners = new Set<() => void>();

function emitViewChange() {
  viewEpoch += 1;
  for (const listener of viewListeners) listener();
}

function subscribeView(onStoreChange: () => void) {
  viewListeners.add(onStoreChange);
  return () => {
    viewListeners.delete(onStoreChange);
  };
}

function readView(): ViewMode {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "grid" ? "grid" : "list";
}

export function CourseRoster({
  items,
  emptyMessage = "No enrolled courses yet.",
  heading,
  description,
  action,
}: {
  items: CourseRosterItem[];
  emptyMessage?: string;
  heading?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const view = useSyncExternalStore(
    subscribeView,
    () => {
      void viewEpoch;
      return readView();
    },
    () => "list" as ViewMode,
  );
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isFavorite, toggleFavorite } = useCourseFavorites();

  function chooseView(next: ViewMode) {
    window.localStorage.setItem(STORAGE_KEY, next);
    emitViewChange();
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {heading ? (
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              {heading}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {action}
          <div
            className="inline-flex rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] p-0.5"
            role="group"
            aria-label="Course layout"
          >
            <button
              type="button"
              onClick={() => chooseView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-[var(--eui-ink)] text-[var(--eui-surface)]"
                  : "text-[var(--eui-ink-muted)] hover:text-[var(--eui-ink)]",
              )}
            >
              <List className="size-3.5" aria-hidden />
              List
            </button>
            <button
              type="button"
              onClick={() => chooseView("grid")}
              aria-pressed={view === "grid"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "grid"
                  ? "bg-[var(--eui-ink)] text-[var(--eui-surface)]"
                  : "text-[var(--eui-ink-muted)] hover:text-[var(--eui-ink)]",
              )}
            >
              <LayoutGrid className="size-3.5" aria-hidden />
              Grid
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[var(--eui-ink-muted)]">{emptyMessage}</p>
      ) : !ready || view === "list" ? (
        <ol className="divide-y divide-[var(--eui-border)] border-y border-[var(--eui-border)]">
          {items.map((item, index) => {
            const favorited = isFavorite(item.id);
            return (
              <li key={item.id} className="relative">
                <Link
                  href={item.href}
                  className="group flex flex-col gap-3 py-5 pr-12 transition-colors hover:bg-[color-mix(in_srgb,var(--eui-surface)_70%,transparent)] md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-teal)] tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                        {item.code}
                      </p>
                      <p className="mt-1 font-semibold text-[var(--eui-ink)] group-hover:text-[var(--eui-teal-deep)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:max-w-[12rem]">
                    <Progress value={item.percent} className="h-1.5" />
                    <p className="mt-1.5 text-xs text-[var(--eui-ink-muted)]">
                      {item.percent}% complete
                    </p>
                  </div>
                </Link>
                <FavoriteButton
                  favorited={favorited}
                  code={item.code}
                  onToggle={() => toggleFavorite(item.id)}
                  className="absolute right-0 top-5"
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => {
            const favorited = isFavorite(item.id);
            return (
              <li key={item.id} className="relative">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col border border-[var(--eui-border)] bg-[color-mix(in_srgb,var(--eui-surface)_80%,transparent)] p-5 pr-12 transition-colors hover:border-[var(--eui-teal)] hover:bg-[var(--eui-surface)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                      {item.code}
                    </p>
                    <span className="font-[family-name:var(--font-display)] text-lg text-[var(--eui-teal)] tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--eui-ink)] group-hover:text-[var(--eui-teal-deep)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--eui-ink-muted)]">
                    {item.subtitle}
                  </p>
                  <div className="mt-auto pt-5">
                    <Progress value={item.percent} className="h-1.5" />
                    <p className="mt-2 text-xs text-[var(--eui-ink-muted)]">
                      {item.percent}% complete
                    </p>
                  </div>
                </Link>
                <FavoriteButton
                  favorited={favorited}
                  code={item.code}
                  onToggle={() => toggleFavorite(item.id)}
                  className="absolute right-3 top-3"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FavoriteButton({
  favorited,
  code,
  onToggle,
  className,
}: {
  favorited: boolean;
  code: string;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={favorited}
      aria-label={
        favorited ? `Remove ${code} from favorites` : `Add ${code} to favorites`
      }
      className={cn(
        "rounded-md p-1.5 transition-colors hover:bg-[var(--eui-teal-soft)]",
        favorited
          ? "text-[var(--eui-teal)]"
          : "text-[var(--eui-ink-muted)] hover:text-[var(--eui-teal)]",
        className,
      )}
    >
      <Star className={cn("size-4", favorited && "fill-current")} />
    </button>
  );
}
