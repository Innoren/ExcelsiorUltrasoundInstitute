"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { CourseRosterItem } from "@/components/portal/course-roster";
import { useCourseFavorites } from "@/components/portal/course-favorites-provider";
import { Progress } from "@/components/ui/progress";

export function FavoriteCoursesBanner({
  items,
}: {
  items: CourseRosterItem[];
}) {
  const { favoriteIds, ready, toggleFavorite } = useCourseFavorites();

  if (!ready) return null;

  const favorites = favoriteIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is CourseRosterItem => Boolean(item));

  if (favorites.length === 0) return null;

  return (
    <section
      aria-label="Favorite courses"
      className="mb-8 overflow-hidden rounded-2xl border border-[var(--eui-teal)]/30 bg-[color-mix(in_srgb,var(--eui-teal-soft)_75%,var(--eui-surface))] px-5 py-5 md:px-6"
    >
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--eui-teal-deep)]">
          <Star className="size-3.5 fill-[var(--eui-teal)] text-[var(--eui-teal)]" />
          Favorites
        </p>
        <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
          Quick access to courses you starred.
        </p>
      </div>

      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {favorites.map((item) => (
          <li key={item.id} className="min-w-[16rem] flex-1 sm:min-w-[18rem]">
            <div className="relative h-full rounded-xl border border-[var(--eui-border)] bg-[var(--eui-surface)] p-4 shadow-sm">
              <button
                type="button"
                onClick={() => toggleFavorite(item.id)}
                aria-label={`Remove ${item.code} from favorites`}
                className="absolute right-3 top-3 rounded-md p-1 text-[var(--eui-teal)] hover:bg-[var(--eui-teal-soft)]"
              >
                <Star className="size-4 fill-current" />
              </button>
              <Link href={item.href} className="block pr-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                  {item.code}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-lg leading-snug text-[var(--eui-ink)]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[var(--eui-ink-muted)]">
                  {item.subtitle}
                </p>
                <Progress value={item.percent} className="mt-3 h-1.5" />
                <p className="mt-1.5 text-xs text-[var(--eui-ink-muted)]">
                  {item.percent}% complete
                </p>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
