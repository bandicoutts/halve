"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start "light" on BOTH the server and the client's first render so the React
  // tree matches during hydration. The *actual* page colours come from the
  // `.dark` class that the inline script in layout.tsx sets before paint — not
  // from this state — so there is no flash. We sync this state to the real theme
  // after mount purely to keep the toggle's `aria-checked` accurate. Reading the
  // class on the client during the initial render (the previous approach) made
  // the server ("light") and client ("dark") renders diverge, which left the
  // ThemeToggle frozen in a stale state that React "won't patch up".
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(htmlIsDark() ? "dark" : "light");

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(LS_KEY) !== null) return; // an explicit choice wins
      document.documentElement.classList.toggle("dark", e.matches);
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    // Flip from the live source of truth (the class on <html>), never from
    // possibly-stale React state, so a click is always correct on first press.
    const next: Theme = htmlIsDark() ? "light" : "dark";
    localStorage.setItem(LS_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
