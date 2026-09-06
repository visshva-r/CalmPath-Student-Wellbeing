"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type Theme = "light" | "dark" | "system";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.theme);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return "system";
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  applyTheme(theme);
  emit();
}

export function cycleTheme(current: Theme): Theme {
  const next = current === "system" ? "light" : current === "light" ? "dark" : "system";
  setTheme(next);
  return next;
}

export function useTheme() {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(readTheme());
      const onScheme = () => {
        applyTheme(readTheme());
        onStoreChange();
      };
      mq.addEventListener("change", onScheme);
      return () => {
        listeners.delete(onStoreChange);
        mq.removeEventListener("change", onScheme);
      };
    },
    readTheme,
    () => "system" as Theme,
  );
}

export function ThemeToggle() {
  const theme = useTheme();
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      type="button"
      onClick={() => cycleTheme(theme)}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-soft"
      aria-label={`Color theme: ${label}. Click to change.`}
    >
      {label}
    </button>
  );
}
