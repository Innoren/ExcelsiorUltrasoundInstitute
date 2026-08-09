export type PersonalCalendarEvent = {
  id: string;
  title: string;
  notes: string;
  date: string; // YYYY-MM-DD
};

export function personalCalendarStorageKey(userId: string) {
  return `eui-personal-calendar:${userId}`;
}

export function readPersonalEvents(userId: string): PersonalCalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(personalCalendarStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const id = String(record.id ?? "").trim();
        const title = String(record.title ?? "").trim();
        const notes = String(record.notes ?? "").trim();
        const date = String(record.date ?? "").trim();
        if (!id || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
        return { id, title, notes, date };
      })
      .filter((item): item is PersonalCalendarEvent => Boolean(item));
  } catch {
    return [];
  }
}

export function writePersonalEvents(
  userId: string,
  events: PersonalCalendarEvent[],
) {
  window.localStorage.setItem(
    personalCalendarStorageKey(userId),
    JSON.stringify(events),
  );
}
