"use client";
import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const LS_KEY = "halve-theme";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

function htmlIsDark() {
  return document.documentElement.classList.contains("dark");
}

function currentTheme(): Theme {
  return htmlIsDark() ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (e: MediaQueryListEvent) => {
    if (localStorage.getItem(LS_KEY) !== null) return;
    document.documentElement.classList.toggle("dark", e.matches);
  };
  mq.addEventListener("change", onSystemChange);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", onSystemChange);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The pre-paint script in layout.tsx sets the class. React reads it after
  // hydration; the server snapshot stays light to avoid a hydration mismatch.
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, (): Theme => "light");

  const toggle = useCallback(() => {
    // Flip from the live source of truth (the class on <html>), never from
    // possibly-stale React state, so a click is always correct on first press.
    const next: Theme = htmlIsDark() ? "light" : "dark";
    localStorage.setItem(LS_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
