"use client";

import { useTheme } from "next-themes";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { LogOut, Moon, Settings, Sun, Trash2, Upload } from "lucide-react";
import { logoutAction } from "@/app/actions/portal";
import { useColorTheme } from "@/components/portal/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BUILTIN_COLOR_THEMES,
  createCustomThemeId,
  isBuiltinColorThemeId,
  isCustomThemeId,
  normalizeHex,
  parseUploadedThemes,
  sanitizeCustomTheme,
} from "@/lib/portal/appearance";
import { cn } from "@/lib/utils";

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const {
    colorTheme,
    setColorTheme,
    customThemes,
    addCustomThemes,
    removeCustomTheme,
  } = useColorTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [label, setLabel] = useState("My theme");
  const [primary, setPrimary] = useState("#0f766e");
  const [secondary, setSecondary] = useState("#e6f4f2");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const mode = mounted ? (theme ?? "light") : "light";

  function saveCreatedTheme() {
    const themeDraft = sanitizeCustomTheme({
      id: createCustomThemeId(),
      label,
      description: "Created in settings",
      primary,
      secondary,
    });
    if (!themeDraft) {
      setUploadError("Enter a name and valid primary/secondary hex colors.");
      return;
    }
    setUploadError(null);
    addCustomThemes([themeDraft]);
  }

  async function onUploadFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const themes = parseUploadedThemes(text);
      setUploadError(null);
      addCustomThemes(themes);
    } catch {
      setUploadError(
        'Upload a JSON theme like {"label":"Brand","primary":"#0f766e","secondary":"#e6f4f2"}.',
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Open settings"
          className="border-[var(--eui-border)] bg-[var(--eui-surface)] text-[var(--eui-ink)]"
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 p-1">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
              mode === "light"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <Sun className="size-3.5" aria-hidden />
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
              mode === "dark"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <Moon className="size-3.5" aria-hidden />
            Dark
          </button>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={colorTheme}
          onValueChange={(value) => {
            if (isBuiltinColorThemeId(value) || isCustomThemeId(value)) {
              setColorTheme(value);
            }
          }}
        >
          {BUILTIN_COLOR_THEMES.map((item) => (
            <DropdownMenuRadioItem
              key={item.id}
              value={item.id}
              className="items-start py-2"
            >
              <span
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0 rounded-sm border border-border"
                style={{ backgroundColor: item.swatch }}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}

          {customThemes.map((item) => (
            <div key={item.id} className="relative">
              <DropdownMenuRadioItem
                value={item.id}
                className="items-start py-2 pr-10"
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0 rounded-sm border border-border"
                  style={{ backgroundColor: item.primary }}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description ?? "Custom theme"}
                  </span>
                </span>
              </DropdownMenuRadioItem>
              <button
                type="button"
                aria-label={`Delete ${item.label}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  removeCustomTheme(item.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Upload or create</DropdownMenuLabel>
        <div className="space-y-3 p-2">
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => onUploadFile(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" aria-hidden />
            Upload theme JSON
          </Button>

          <div className="space-y-2 rounded-md border border-border p-2">
            <div>
              <Label htmlFor="theme-label" className="text-xs">
                Name
              </Label>
              <Input
                id="theme-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="mt-1 h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="theme-primary" className="text-xs">
                  Primary
                </Label>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="color"
                    value={normalizeHex(primary) ?? "#0f766e"}
                    onChange={(event) => setPrimary(event.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                    aria-label="Primary color"
                  />
                  <Input
                    id="theme-primary"
                    value={primary}
                    onChange={(event) => setPrimary(event.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="theme-secondary" className="text-xs">
                  Secondary
                </Label>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="color"
                    value={normalizeHex(secondary) ?? "#e6f4f2"}
                    onChange={(event) => setSecondary(event.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                    aria-label="Secondary color"
                  />
                  <Input
                    id="theme-secondary"
                    value={secondary}
                    onChange={(event) => setSecondary(event.target.value)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={saveCreatedTheme}
            >
              Save custom theme
            </Button>
          </div>

          {uploadError ? (
            <p className="text-xs text-destructive">{uploadError}</p>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Upload JSON with <code>label</code>, <code>primary</code>, and{" "}
              <code>secondary</code> hex colors. Arrays of themes are supported.
            </p>
          )}
        </div>

        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
