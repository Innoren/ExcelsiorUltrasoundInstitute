export function favoritesStorageKey(userId: string) {
  return `eui-course-favorites:${userId}`;
}

export function readFavoriteIds(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(favoritesStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeFavoriteIds(userId: string, ids: string[]) {
  window.localStorage.setItem(favoritesStorageKey(userId), JSON.stringify(ids));
}
