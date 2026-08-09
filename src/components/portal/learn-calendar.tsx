"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  readPersonalEvents,
  writePersonalEvents,
  type PersonalCalendarEvent,
} from "@/lib/portal/personal-calendar";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  href?: string;
  kind: "cohort" | "assessment" | "grade" | "personal";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function personalToCalendar(event: PersonalCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    subtitle: event.notes || "Personal event",
    date: event.date,
    kind: "personal",
  };
}

let personalEpoch = 0;
const personalListeners = new Set<() => void>();

function emitPersonalChange() {
  personalEpoch += 1;
  for (const listener of personalListeners) listener();
}

function subscribePersonal(onStoreChange: () => void) {
  personalListeners.add(onStoreChange);
  return () => {
    personalListeners.delete(onStoreChange);
  };
}

export function LearnCalendar({
  userId,
  events: schoolEvents,
}: {
  userId: string;
  events: CalendarEvent[];
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState(() => toKey(new Date()));
  const personalSerialized = useSyncExternalStore(
    subscribePersonal,
    () => {
      void personalEpoch;
      return JSON.stringify(readPersonalEvents(userId));
    },
    () => "[]",
  );
  const personalEvents = useMemo(
    () => JSON.parse(personalSerialized) as PersonalCalendarEvent[],
    [personalSerialized],
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => toKey(new Date()));
  const [error, setError] = useState<string | null>(null);

  const events = useMemo(() => {
    return [...schoolEvents, ...personalEvents.map(personalToCalendar)];
  }, [schoolEvents, personalEvents]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const startOffset = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      const key = toKey(day);
      return {
        key,
        date: day,
        inMonth: day.getMonth() === month.getMonth(),
        events: eventsByDay.get(key) ?? [],
      };
    });
  }, [month, eventsByDay]);

  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const monthLabel = month.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayKey = toKey(new Date());

  const monthAgenda = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    return events
      .filter((event) => event.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, month]);

  function openAddDialog(forDate = selectedKey) {
    setDate(forDate);
    setTitle("");
    setNotes("");
    setError(null);
    setDialogOpen(true);
  }

  function savePersonalEvent() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Add a title for your event.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Choose a valid date.");
      return;
    }

    const nextEvent: PersonalCalendarEvent = {
      id: `personal:${crypto.randomUUID()}`,
      title: trimmedTitle.slice(0, 80),
      notes: notes.trim().slice(0, 160),
      date,
    };
    const next = [...personalEvents, nextEvent].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    writePersonalEvents(userId, next);
    emitPersonalChange();
    setSelectedKey(date);
    setMonth(startOfMonth(parseKey(date)));
    setDialogOpen(false);
  }

  function deletePersonalEvent(eventId: string) {
    const next = personalEvents.filter((event) => event.id !== eventId);
    writePersonalEvents(userId, next);
    emitPersonalChange();
  }

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--eui-teal)]">
          Excelsior learning
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--eui-ink)] md:text-4xl">
          Calendar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--eui-ink-muted)] md:text-base">
          School dates plus your own reminders. Hover a day and click + to add a
          personal event.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-[var(--eui-border)] bg-[var(--eui-surface)] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Previous month"
                onClick={() => setMonth((current) => addMonths(current, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const now = startOfMonth(new Date());
                  setMonth(now);
                  setSelectedKey(toKey(new Date()));
                }}
              >
                Today
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Next month"
                onClick={() => setMonth((current) => addMonths(current, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--eui-ink-muted)]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-1 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const selected = cell.key === selectedKey;
              const isToday = cell.key === todayKey;
              return (
                <div
                  key={cell.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedKey(cell.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedKey(cell.key);
                    }
                  }}
                  className={cn(
                    "group relative min-h-20 cursor-pointer rounded-lg border px-1.5 py-1.5 text-left transition-colors",
                    cell.inMonth
                      ? "border-[var(--eui-border)] bg-[var(--eui-canvas)]/40"
                      : "border-transparent text-[var(--eui-ink-muted)] opacity-50",
                    selected &&
                      "border-[var(--eui-teal)] bg-[var(--eui-teal-soft)]",
                    isToday && !selected && "ring-1 ring-[var(--eui-teal)]/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold",
                        isToday && "bg-[var(--eui-teal)] text-white",
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add event on ${cell.key}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedKey(cell.key);
                        openAddDialog(cell.key);
                      }}
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-md bg-[var(--eui-teal)] text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                        "hover:bg-[var(--eui-teal-deep)]",
                      )}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {cell.events.slice(0, 2).map((event) => (
                      <p
                        key={event.id}
                        className={cn(
                          "truncate rounded-sm px-1 py-0.5 text-[10px] font-medium",
                          event.kind === "personal"
                            ? "bg-[var(--eui-teal)] text-white"
                            : "bg-[var(--eui-surface)] text-[var(--eui-teal-deep)]",
                        )}
                      >
                        {event.title}
                      </p>
                    ))}
                    {cell.events.length > 2 ? (
                      <p className="px-1 text-[10px] text-[var(--eui-ink-muted)]">
                        +{cell.events.length - 2} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[var(--eui-border)] bg-[var(--eui-surface)] p-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl">
              {parseKey(selectedKey).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <div className="mt-4 space-y-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-[var(--eui-ink-muted)]">
                  Nothing scheduled for this day.
                </p>
              ) : (
                selectedEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onDelete={
                      event.kind === "personal"
                        ? () => deletePersonalEvent(event.id)
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--eui-border)] bg-[var(--eui-surface)] p-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl">
              This month
            </h3>
            <div className="mt-4 space-y-3">
              {monthAgenda.length === 0 ? (
                <p className="text-sm text-[var(--eui-ink-muted)]">
                  No events on the calendar this month.
                </p>
              ) : (
                monthAgenda.map((event) => (
                  <EventRow
                    key={`${event.id}-month`}
                    event={event}
                    showDate
                    onDelete={
                      event.kind === "personal"
                        ? () => deletePersonalEvent(event.id)
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add personal event</DialogTitle>
            <DialogDescription>
              Saved on this device and shown only on your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1"
                placeholder="Study group / clinical shift"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="event-notes">Notes</Label>
              <Textarea
                id="event-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Optional details"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              onClick={savePersonalEvent}
            >
              Save event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EventRow({
  event,
  showDate = false,
  onDelete,
}: {
  event: CalendarEvent;
  showDate?: boolean;
  onDelete?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--eui-ink)]">{event.title}</p>
        <span className="shrink-0 rounded-md bg-[var(--eui-teal-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--eui-teal-deep)]">
          {event.kind}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--eui-ink-muted)]">
        {showDate
          ? `${parseKey(event.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })} · ${event.subtitle}`
          : event.subtitle}
      </p>
    </>
  );

  return (
    <div className="rounded-lg border border-[var(--eui-border)] px-3 py-2.5 transition-colors hover:border-[var(--eui-teal)]">
      <div className="flex items-start gap-2">
        {event.href ? (
          <Link href={event.href} className="min-w-0 flex-1">
            {body}
          </Link>
        ) : (
          <div className="min-w-0 flex-1">{body}</div>
        )}
        {onDelete ? (
          <button
            type="button"
            aria-label={`Delete ${event.title}`}
            onClick={onDelete}
            className="rounded-md p-1 text-[var(--eui-ink-muted)] hover:bg-[var(--eui-teal-soft)] hover:text-[var(--eui-teal-deep)]"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
