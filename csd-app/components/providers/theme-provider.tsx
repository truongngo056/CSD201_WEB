"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProgressStore } from "@/lib/store/progress-store";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
};

const STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Rehydrate persisted progress after mount (skipHydration on the store).
    void useProgressStore.persist.rehydrate();

    let initial: Theme = "dark";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      } else {
        initial = "light";
      }
    } catch {
      // ignore storage access errors
    }
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyThemeClass(next);
  }, []);

  const value = useMemo(
    () => ({
      theme: mounted ? theme : "dark",
      setTheme,
      resolvedTheme: mounted ? theme : "dark",
    }),
    [mounted, theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
