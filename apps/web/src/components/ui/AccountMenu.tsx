"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Monogram } from "@/components/ui/Monogram";

function StatsIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  height: 40,
  padding: "0 12px",
  background: "none",
  border: "none",
  borderRadius: "var(--radius-sm)",
  color: "var(--fg-2)",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "var(--font-sans)",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
  transition: "background .12s, color .12s",
};

function hoverOn(e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.background = "var(--bg-sunken)";
  e.currentTarget.style.color = "var(--fg-1)";
}
function hoverOff(e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.background = "none";
  e.currentTarget.style.color = "var(--fg-2)";
}

/**
 * Account affordance for the TopBar: a monogram avatar that opens a small
 * popover menu (name header → Statistics · Sign out). One pattern that works
 * on both surfaces — click-to-open on desktop, tap-to-open on mobile — so
 * sign-out is always one interaction from wherever the menu appears.
 */
export function AccountMenu({ displayName }: { displayName: string }) {
  const router = useRouter();
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
    if (open) {
      const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [open]);

  // Arrow-key navigation between items.
  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown"
      ? items[(idx + 1) % items.length]
      : items[(idx - 1 + items.length) % items.length];
    next?.focus();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const name = displayName.trim() || "Account";
  // Capitalise real names, but leave emails (the fallback when no display name
  // is set) untouched — "stayrightdemo@gmail.com", not "Stayrightdemo@Gmail.Com".
  const nameCasing = name.includes("@") ? "none" : "capitalize";

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
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          padding: 0,
          borderRadius: 999,
          cursor: "pointer",
          transition: "box-shadow .15s",
          boxShadow: open ? "0 0 0 2px var(--accent-tint)" : "none",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-tint)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.boxShadow = "none"; }}
      >
        <Monogram name={name} size={32} />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 208,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            padding: 6,
            zIndex: 50,
            animation: "fade-up .12s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* Identity header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 10px" }}>
            <Monogram name={name} size={32} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", textTransform: nameCasing, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 1 }}>Signed in</div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--hairline)", margin: "2px 0 4px" }} />

          <Link
            href="/stats"
            role="menuitem"
            onClick={() => setOpen(false)}
            style={itemStyle}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onFocus={hoverOn}
            onBlur={hoverOff}
          >
            <StatsIcon />
            Statistics
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            style={itemStyle}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
            onFocus={hoverOn}
            onBlur={hoverOff}
          >
            <SignOutIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
