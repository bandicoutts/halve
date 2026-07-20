"use client";
import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";

interface GhostLinkProps {
  children: ReactNode;
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  type?: "button" | "submit";
  disabled?: boolean;
}

const style: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--fg-3)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.18em",
  padding: "4px 0",
  transition: "color 0.18s ease",
  textDecoration: "none",
  textAlign: "left",
};

/** Shared mono-text dismiss/secondary control — CLOSE, BACK, SKIP, "use a different email", etc. */
export function GhostLink({ children, href, onClick, type = "button", disabled }: GhostLinkProps) {
  const onMouseEnter = (e: MouseEvent<HTMLElement>) => {
    if (!disabled) e.currentTarget.style.color = "var(--accent)";
  };
  const onMouseLeave = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.color = "var(--fg-3)";
  };

  if (href) {
    return (
      <Link href={href} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...style, opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
}
