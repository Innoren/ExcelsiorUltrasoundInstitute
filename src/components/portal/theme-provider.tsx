"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  applyCustomThemeVars,
  clearCustomThemeVars,
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
  isBuiltinColorThemeId,
  isCustomThemeId,
  readCustomThemes,
  writeCustomThemes,
  type ColorThemeId,
  type CustomColorTheme,
} from "@/lib/portal/appearance";

type ColorThemeContextValue = {
  colorTheme: ColorThemeId;
  customThemes: CustomColorTheme[];
  setColorTheme: (theme: ColorThemeId) => void;
  addCustomThemes: (themes: CustomColorTheme[]) => void;
  removeCustomTheme: (id: string) => void;
  getActiveCustomTheme: () => CustomColorTheme | null;
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

let colorThemeEpoch = 0;
const colorThemeListeners = new Set<() => void>();

function emitColorThemeChange() {
  colorThemeEpoch += 1;
  for (const listener of colorThemeListeners) listener();
}

function subscribeColorTheme(onStoreChange: () => void) {
  colorThemeListeners.add(onStoreChange);
  return () => {
    colorThemeListeners.delete(onStoreChange);
  };
}

type StoredAppearance = {
  colorTheme: ColorThemeId;
  customThemes: CustomColorTheme[];
};

function readStoredAppearance(): StoredAppearance {
  void colorThemeEpoch;
  const customThemes = readCustomThemes();
  const saved = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  if (
    saved &&
    (isBuiltinColorThemeId(saved) ||
      customThemes.some((theme) => theme.id === saved))
  ) {
    return { colorTheme: saved, customThemes };
  }
  return { colorTheme: DEFAULT_COLOR_THEME, customThemes };
}

function ColorThemeEffects({
  colorTheme,
  customThemes,
}: {
  colorTheme: ColorThemeId;
  customThemes: CustomColorTheme[];
}) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (isCustomThemeId(colorTheme)) {
      const custom = customThemes.find((theme) => theme.id === colorTheme);
      if (!custom) {
        root.setAttribute("data-color-theme", DEFAULT_COLOR_THEME);
        clearCustomThemeVars(root);
        return;
      }
      root.setAttribute("data-color-theme", "custom");
      applyCustomThemeVars(
        custom,
        resolvedTheme === "dark" ? "dark" : "light",
        root,
      );
      return;
    }

    clearCustomThemeVars(root);
    root.setAttribute(
      "data-color-theme",
      isBuiltinColorThemeId(colorTheme) ? colorTheme : DEFAULT_COLOR_THEME,
    );
  }, [colorTheme, customThemes, resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storedSerialized = useSyncExternalStore(
    subscribeColorTheme,
    () => JSON.stringify(readStoredAppearance()),
    () =>
      JSON.stringify({
        colorTheme: DEFAULT_COLOR_THEME,
        customThemes: [],
      } satisfies StoredAppearance),
  );
  const stored = useMemo(
    () => JSON.parse(storedSerialized) as StoredAppearance,
    [storedSerialized],
  );
  const { colorTheme, customThemes } = stored;

  const setColorTheme = useCallback((theme: ColorThemeId) => {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
    emitColorThemeChange();
  }, []);

  const addCustomThemes = useCallback(
    (themes: CustomColorTheme[]) => {
      const current = readCustomThemes();
      const next = [...themes, ...current].slice(0, 24);
      writeCustomThemes(next);
      if (themes[0]) {
        window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, themes[0].id);
      }
      emitColorThemeChange();
    },
    [],
  );

  const removeCustomTheme = useCallback((id: string) => {
    const current = readCustomThemes();
    const next = current.filter((theme) => theme.id !== id);
    writeCustomThemes(next);
    const active = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (active === id) {
      window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, DEFAULT_COLOR_THEME);
    }
    emitColorThemeChange();
  }, []);

  const getActiveCustomTheme = useCallback(() => {
    if (!isCustomThemeId(colorTheme)) return null;
    return customThemes.find((theme) => theme.id === colorTheme) ?? null;
  }, [colorTheme, customThemes]);

  const value = useMemo(
    () => ({
      colorTheme,
      customThemes,
      setColorTheme,
      addCustomThemes,
      removeCustomTheme,
      getActiveCustomTheme,
    }),
    [
      colorTheme,
      customThemes,
      setColorTheme,
      addCustomThemes,
      removeCustomTheme,
      getActiveCustomTheme,
    ],
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ColorThemeContext.Provider value={value}>
        <ColorThemeEffects
          colorTheme={colorTheme}
          customThemes={customThemes}
        />
        {children}
      </ColorThemeContext.Provider>
    </NextThemesProvider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) {
    throw new Error("useColorTheme must be used within ThemeProvider");
  }
  return ctx;
}
