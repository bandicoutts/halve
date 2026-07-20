"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Mark } from "@/components/symbols/Mark";
import { HEADER_BAR } from "@/components/ui/Wordmark";
import { AccountMenu, SignedInMenuItems } from "@/components/ui/AccountMenu";

type NavKey = "practice" | "archive" | "stats";

interface SiteHeaderProps {
  /** Highlights the matching nav item. */
  active?: NavKey | undefined;
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
  /** Hide the sign-in / account control (e.g. on the focused Play screen). */
  hideAuth?: boolean | undefined;
  /**
   * Optional navigation guard. Return `true` to block the default navigation
   * (e.g. the Play screen intercepts to confirm abandoning an in-progress
   * puzzle). Applies to the wordmark and every nav link.
   */
  interceptHref?: ((href: string) => boolean) | undefined;
}

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "practice", label: "Practice", href: "/practice" },
  { key: "archive", label: "Archive", href: "/archive" },
  { key: "stats", label: "Stats", href: "/stats" },
];

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

/** Split-circle glyph that rotates 180° between themes (see globals.css).
 *  Shared with WinScreen, which needs the same control in its own header. */
export function ThemeGlyph() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Toggle theme"
      onClick={toggle}
      suppressHydrationWarning
      className="hv-tap44"
      style={{ ...circleBtn, display: "flex" }}
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

// NOTE: no `display` here — the burger's visibility is controlled by the
// .hv-nav-burger media query, and an inline display would override it.
const circleBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid var(--hairline)",
  background: "none",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  color: "var(--fg-1)",
  transition: "border-color 0.18s ease",
};

const sheetItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: 44,
  width: "100%",
  padding: "10px 14px",
  background: "none",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.16em",
  textDecoration: "none",
  transition: "background .15s, color .15s",
};

export function SiteHeader({
  active,
  isAuthenticated,
  displayName,
  hideAuth,
  interceptHref,
}: SiteHeaderProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Guarded navigation (wordmark + every nav link). Returns an onClick handler.
  function go(href: string, alsoClose = false) {
    return (e: React.MouseEvent) => {
      if (alsoClose) setMenuOpen(false);
      if (interceptHref?.(href)) e.preventDefault();
    };
  }

  return (
    <header style={HEADER_BAR}>
      <Link
        href="/"
        onClick={go("/")}
        aria-label="Halve home"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg-1)" }}
      >
        <Mark size={21} />
        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em" }}>
          Halve
        </span>
      </Link>

      <nav ref={navRef} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18 }}>
        {/* Desktop inline nav (≥560px) */}
        <div className="hv-nav-desktop">
          {NAV.map(({ key, label, href }) => {
            const isHot = hovered === key || active === key;
            return (
              <Link
                key={key}
                href={href}
                onClick={go(href)}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                aria-current={active === key ? "page" : undefined}
                style={{ ...MONO_LINK, color: isHot ? "var(--accent-text)" : "var(--fg-3)" }}
              >
                {label}
              </Link>
            );
          })}
          {!hideAuth &&
            (isAuthenticated ? (
              <AccountMenu displayName={displayName || "You"} />
            ) : (
              <Link
                href="/auth"
                onClick={go("/auth")}
                onMouseEnter={() => setHovered("signin")}
                onMouseLeave={() => setHovered(null)}
                style={{ ...MONO_LINK, color: hovered === "signin" ? "var(--accent-text)" : "var(--fg-3)" }}
              >
                Sign in
              </Link>
            ))}
        </div>

        <ThemeGlyph />

        {/* Hamburger (<560px) */}
        <button
          ref={burgerRef}
          type="button"
          className="hv-nav-burger hv-tap44"
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={circleBtn}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            {menuOpen ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            role="menu"
            aria-label="Menu"
            style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              right: 0,
              width: 220,
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: 16,
              boxShadow: "var(--shadow-lg)",
              padding: 8,
              zIndex: 50,
              animation: "fadeup .16s var(--ease-editorial) both",
            }}
          >
            {NAV.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                role="menuitem"
                onClick={go(href, true)}
                aria-current={active === key ? "page" : undefined}
                style={{ ...sheetItem, color: active === key ? "var(--accent-text)" : "var(--fg-1)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--hover)";
                  e.currentTarget.style.color = "var(--accent-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = active === key ? "var(--accent-text)" : "var(--fg-1)";
                }}
              >
                {label.toUpperCase()}
              </Link>
            ))}

            {!hideAuth && (
              <>
                <div style={{ height: 1, background: "var(--hairline)", margin: "6px 6px" }} />
                {isAuthenticated ? (
                  <SignedInMenuItems
                    displayName={displayName || "You"}
                    itemStyle={sheetItem}
                    onClose={() => setMenuOpen(false)}
                  />
                ) : (
                  <Link
                    href="/auth"
                    role="menuitem"
                    onClick={go("/auth", true)}
                    style={{ ...sheetItem, color: "var(--fg-1)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--hover)";
                      e.currentTarget.style.color = "var(--accent-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "var(--fg-1)";
                    }}
                  >
                    SIGN IN
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
