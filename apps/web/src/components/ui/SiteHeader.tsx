"use client";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Mark } from "@/components/symbols/Mark";
import { AccountMenu } from "@/components/ui/AccountMenu";

type NavKey = "practice" | "archive" | "stats";

interface SiteHeaderProps {
  /** Highlights the matching nav item. */
  active?: NavKey | undefined;
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
  /** Hide the sign-in / account control (e.g. on the focused Play screen). */
  hideAuth?: boolean | undefined;
  /** Constrains the header to the same column as the page below it. */
  maxWidth?: number | undefined;
  /**
   * Optional navigation guard. Return `true` to block the default navigation
   * (e.g. the Play screen intercepts to confirm abandoning an in-progress
   * puzzle). Applies to the wordmark and every nav link.
   */
  interceptHref?: ((href: string) => boolean) | undefined;
}

const MONO_LINK: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--fg-3)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "4px 0",
  transition: "color 0.18s ease",
  whiteSpace: "nowrap",
};

/** Split-circle glyph that rotates 180° between themes (see globals.css). */
function ThemeGlyph() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Toggle theme"
      onClick={toggle}
      suppressHydrationWarning
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "1px solid var(--hairline)",
        background: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "border-color 0.18s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
    >
      <svg viewBox="0 0 200 200" className="theme-glyph" style={{ width: 15, height: 15 }} aria-hidden="true">
        <path d="M95 10 A90 90 0 0 0 95 190 Z" style={{ fill: "var(--fg-1)", opacity: 0.85 }} />
        <circle cx="100" cy="100" r="90" style={{ fill: "none", stroke: "var(--fg-1)", strokeWidth: "10px", opacity: 0.85 }} />
      </svg>
    </button>
  );
}

export function SiteHeader({
  active,
  isAuthenticated,
  displayName,
  hideAuth,
  maxWidth = 1280,
  interceptHref,
}: SiteHeaderProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  function go(href: string) {
    return (e: React.MouseEvent) => {
      if (interceptHref?.(href)) {
        e.preventDefault();
      }
    };
  }

  function navLink(key: NavKey, label: string, href: string) {
    const isActive = active === key;
    const isHot = hovered === key || isActive;
    return (
      <Link
        href={href}
        onClick={go(href)}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
        aria-current={isActive ? "page" : undefined}
        style={{ ...MONO_LINK, color: isHot ? "var(--accent)" : "var(--fg-3)" }}
      >
        {label}
      </Link>
    );
  }

  return (
    <header
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px 18px",
        padding: "20px clamp(20px, 4vw, 40px)",
        maxWidth,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Link
        href="/"
        onClick={go("/")}
        aria-label="Halve — home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "var(--fg-1)",
        }}
      >
        <Mark size={21} />
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "-0.01em",
          }}
        >
          Halve
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "clamp(14px, 2.6vw, 22px)" }}>
        {navLink("practice", "Practice", "/practice")}
        {navLink("archive", "Archive", "/archive")}
        {navLink("stats", "Stats", "/stats")}
        {!hideAuth &&
          (isAuthenticated ? (
            <AccountMenu displayName={displayName || "?"} />
          ) : (
            <Link
              href="/auth"
              onClick={go("/auth")}
              onMouseEnter={() => setHovered("signin")}
              onMouseLeave={() => setHovered(null)}
              style={{ ...MONO_LINK, color: hovered === "signin" ? "var(--accent)" : "var(--fg-3)" }}
            >
              Sign in
            </Link>
          ))}
        <ThemeGlyph />
      </nav>
    </header>
  );
}
