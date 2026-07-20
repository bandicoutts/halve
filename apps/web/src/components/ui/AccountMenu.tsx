"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const menuItemBase: React.CSSProperties = {
  display: "flex",
  width: "100%",
  textAlign: "left",
  padding: "12px 14px",
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

/**
 * Shared "signed in / Statistics / Sign out" block — rendered by both the
 * desktop popover (below) and SiteHeader's mobile sheet. `itemStyle` lets
 * each context keep its own touch-target sizing (the mobile sheet needs a
 * 44px-tall row; the desktop popover doesn't).
 */
export function SignedInMenuItems({
  displayName,
  itemStyle,
  onClose,
}: {
  displayName: string;
  itemStyle: React.CSSProperties;
  onClose: () => void;
}) {
  const router = useRouter();
  const name = displayName.trim() || "Account";
  const nameCasing = name.includes("@") ? "none" : "capitalize";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    onClose();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.22em", color: "var(--fg-3)" }}>SIGNED IN</span>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 20,
            textTransform: nameCasing,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
      </div>

      <div style={{ height: 1, background: "var(--hairline)", margin: "2px 6px 6px" }} />

      <Link
        href="/stats"
        role="menuitem"
        onClick={onClose}
        style={{ ...itemStyle, color: "var(--fg-1)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--hover)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--fg-1)";
        }}
      >
        STATISTICS
      </Link>

      <Link
        href="/auth?mode=password"
        role="menuitem"
        onClick={onClose}
        style={{ ...itemStyle, color: "var(--fg-1)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--hover)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--fg-1)";
        }}
      >
        SET PASSWORD
      </Link>

      <button
        type="button"
        role="menuitem"
        onClick={handleSignOut}
        style={{ ...itemStyle, color: "var(--fg-3)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--hover)";
          e.currentTarget.style.color = "var(--err)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--fg-3)";
        }}
      >
        SIGN OUT
      </button>
    </>
  );
}

/**
 * Account affordance for the header: a monogram avatar that opens a small
 * popover (signed-in name → Statistics · Sign out). Click/tap-to-open on both
 * surfaces, with full keyboard support (Escape, arrow nav, outside-click).
 */
export function AccountMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape (Escape returns focus to the trigger).
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  // Arrow-key navigation between items.
  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown" ? items[(idx + 1) % items.length] : items[(idx - 1 + items.length) % items.length];
    next?.focus();
  }

  const initial = (displayName.trim() || "Account")[0]!.toUpperCase();

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: `1px solid ${open ? "var(--accent)" : "var(--hairline)"}`,
          background: "var(--surface)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--fg-1)",
          transition: "border-color .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = open ? "var(--accent)" : "var(--hairline)")}
      >
        {initial}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 244,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lg)",
            padding: 8,
            zIndex: 50,
            animation: "fadeup .16s var(--ease-editorial) both",
          }}
        >
          <SignedInMenuItems displayName={displayName} itemStyle={menuItemBase} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
