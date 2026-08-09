"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  readFavoriteIds,
  writeFavoriteIds,
} from "@/lib/portal/course-favorites";

type CourseFavoritesContextValue = {
  favoriteIds: string[];
  ready: boolean;
  isFavorite: (courseId: string) => boolean;
  toggleFavorite: (courseId: string) => void;
};

const CourseFavoritesContext =
  createContext<CourseFavoritesContextValue | null>(null);

let favoritesEpoch = 0;
const favoritesListeners = new Set<() => void>();

function emitFavoritesChange() {
  favoritesEpoch += 1;
  for (const listener of favoritesListeners) listener();
}

function subscribeFavorites(onStoreChange: () => void) {
  favoritesListeners.add(onStoreChange);
  return () => {
    favoritesListeners.delete(onStoreChange);
  };
}

export function CourseFavoritesProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const favoriteIds = useSyncExternalStore(
    subscribeFavorites,
    () => {
      void favoritesEpoch;
      return readFavoriteIds(userId).join("\0");
    },
    () => "",
  )
    .split("\0")
    .filter(Boolean);

  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isFavorite = useCallback(
    (courseId: string) => favoriteIds.includes(courseId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (courseId: string) => {
      const current = readFavoriteIds(userId);
      const next = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId];
      writeFavoriteIds(userId, next);
      emitFavoritesChange();
    },
    [userId],
  );

  const value = useMemo(
    () => ({ favoriteIds, ready, isFavorite, toggleFavorite }),
    [favoriteIds, ready, isFavorite, toggleFavorite],
  );

  return (
    <CourseFavoritesContext.Provider value={value}>
      {children}
    </CourseFavoritesContext.Provider>
  );
}

export function useCourseFavorites() {
  const ctx = useContext(CourseFavoritesContext);
  if (!ctx) {
    throw new Error(
      "useCourseFavorites must be used within CourseFavoritesProvider",
    );
  }
  return ctx;
}
