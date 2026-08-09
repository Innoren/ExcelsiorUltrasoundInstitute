export const BUILTIN_COLOR_THEMES = [
  {
    id: "teal",
    label: "Teal",
    description: "Excelsior default",
    swatch: "#0f766e",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Deep clinical blue",
    swatch: "#1d4e89",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Moss and olive",
    swatch: "#3f6212",
  },
  {
    id: "slate",
    label: "Slate",
    description: "Cool steel",
    swatch: "#475569",
  },
  {
    id: "copper",
    label: "Copper",
    description: "Warm bronze accent",
    swatch: "#b45309",
  },
] as const;

/** @deprecated use BUILTIN_COLOR_THEMES */
export const COLOR_THEMES = BUILTIN_COLOR_THEMES;

export type BuiltinColorThemeId = (typeof BUILTIN_COLOR_THEMES)[number]["id"];

export type CustomColorTheme = {
  id: string;
  label: string;
  description?: string;
  primary: string;
  secondary: string;
};

export type ColorThemeId = BuiltinColorThemeId | string;

export const COLOR_THEME_STORAGE_KEY = "eui-color-theme";
export const CUSTOM_THEMES_STORAGE_KEY = "eui-custom-color-themes";
export const DEFAULT_COLOR_THEME: BuiltinColorThemeId = "teal";

export function isBuiltinColorThemeId(
  value: string | null | undefined,
): value is BuiltinColorThemeId {
  return BUILTIN_COLOR_THEMES.some((theme) => theme.id === value);
}

/** Back-compat alias */
export const isColorThemeId = isBuiltinColorThemeId;

export function isCustomThemeId(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("custom:"));
}

export function createCustomThemeId() {
  return `custom:${crypto.randomUUID()}`;
}

export function normalizeHex(value: string): string | null {
  const raw = value.trim();
  const short = /^#([0-9a-fA-F]{3})$/;
  const long = /^#([0-9a-fA-F]{6})$/;
  if (long.test(raw)) return raw.toLowerCase();
  const shortMatch = raw.match(short);
  if (!shortMatch) return null;
  const [r, g, b] = shortMatch[1].split("");
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(hexA: string, hexB: string, amount: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

function contrastForeground(hex: string) {
  return luminance(hex) > 0.45 ? "#0b1f24" : "#f8fffe";
}

export type ThemeCssVars = Record<string, string>;

export function buildCustomThemeVars(
  theme: Pick<CustomColorTheme, "primary" | "secondary">,
  mode: "light" | "dark" = "light",
): ThemeCssVars {
  const primary = normalizeHex(theme.primary) ?? "#0f766e";
  const secondary = normalizeHex(theme.secondary) ?? mix(primary, "#ffffff", 0.85);

  if (mode === "dark") {
    const accent = mix(primary, "#ffffff", 0.35);
    const soft = mix(primary, "#0b1417", 0.72);
    const deep = mix(accent, "#ffffff", 0.2);
    return {
      "--eui-teal": accent,
      "--eui-teal-deep": deep,
      "--eui-teal-glow": mix(accent, "#ffffff", 0.35),
      "--eui-teal-soft": soft,
      "--primary": accent,
      "--primary-foreground": contrastForeground(accent),
      "--secondary": soft,
      "--secondary-foreground": mix(accent, "#ffffff", 0.55),
      "--accent": soft,
      "--accent-foreground": mix(accent, "#ffffff", 0.55),
      "--ring": accent,
      "--chart-1": accent,
      "--sidebar-primary": accent,
      "--sidebar-primary-foreground": contrastForeground(accent),
      "--sidebar-accent": soft,
      "--sidebar-accent-foreground": mix(accent, "#ffffff", 0.55),
      "--sidebar-ring": accent,
    };
  }

  const deep = mix(primary, "#000000", 0.22);
  const glow = mix(primary, "#ffffff", 0.45);
  const soft = mix(secondary, "#ffffff", 0.15);
  return {
    "--eui-teal": primary,
    "--eui-teal-deep": deep,
    "--eui-teal-glow": glow,
    "--eui-teal-soft": soft,
    "--eui-sand": mix(soft, "#f5f5f0", 0.35),
    "--primary": primary,
    "--primary-foreground": contrastForeground(primary),
    "--secondary": soft,
    "--secondary-foreground": deep,
    "--accent": soft,
    "--accent-foreground": deep,
    "--ring": primary,
    "--chart-1": primary,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": contrastForeground(primary),
    "--sidebar-accent": soft,
    "--sidebar-accent-foreground": deep,
    "--sidebar-ring": primary,
  };
}

const CUSTOM_VAR_KEYS = [
  "--eui-teal",
  "--eui-teal-deep",
  "--eui-teal-glow",
  "--eui-teal-soft",
  "--eui-sand",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--chart-1",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-ring",
] as const;

export function clearCustomThemeVars(target: HTMLElement = document.documentElement) {
  for (const key of CUSTOM_VAR_KEYS) {
    target.style.removeProperty(key);
  }
}

export function applyCustomThemeVars(
  theme: Pick<CustomColorTheme, "primary" | "secondary">,
  mode: "light" | "dark",
  target: HTMLElement = document.documentElement,
) {
  const vars = buildCustomThemeVars(theme, mode);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }
}

export function readCustomThemes(): CustomColorTheme[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeCustomTheme(item))
      .filter((item): item is CustomColorTheme => Boolean(item));
  } catch {
    return [];
  }
}

export function writeCustomThemes(themes: CustomColorTheme[]) {
  window.localStorage.setItem(
    CUSTOM_THEMES_STORAGE_KEY,
    JSON.stringify(themes),
  );
}

export function sanitizeCustomTheme(value: unknown): CustomColorTheme | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const primary = normalizeHex(String(record.primary ?? ""));
  const secondary = normalizeHex(String(record.secondary ?? ""));
  const label = String(record.label ?? "").trim();
  if (!primary || !secondary || !label) return null;
  const idRaw = String(record.id ?? "").trim();
  const id = idRaw.startsWith("custom:") ? idRaw : createCustomThemeId();
  const description = String(record.description ?? "Custom upload").trim();
  return {
    id,
    label: label.slice(0, 40),
    description: description.slice(0, 80) || "Custom upload",
    primary,
    secondary,
  };
}

export function parseUploadedThemes(text: string): CustomColorTheme[] {
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? [parsed]
      : [];

  const themes = list
    .map((item) => sanitizeCustomTheme(item))
    .filter((item): item is CustomColorTheme => Boolean(item));

  if (themes.length === 0) {
    throw new Error("No valid themes found in file");
  }
  return themes.map((theme) => ({
    ...theme,
    id: createCustomThemeId(),
  }));
}

export function themeToDownloadJson(theme: CustomColorTheme) {
  return JSON.stringify(
    {
      label: theme.label,
      description: theme.description,
      primary: theme.primary,
      secondary: theme.secondary,
    },
    null,
    2,
  );
}
