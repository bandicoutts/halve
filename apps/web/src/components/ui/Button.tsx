"use client";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "lg" | "sm";
  full?: boolean;
  /** Renders as a Next `Link` styled identically to the button, for CTAs that navigate. */
  href?: string | undefined;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "lg", full, href, children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    height: size === "sm" ? 44 : 52,
    borderRadius: "var(--radius-full)",
    padding: size === "sm" ? "0 20px" : "0 28px",
    fontSize: size === "sm" ? "var(--text-small)" : "var(--text-body)",
    fontWeight: 500,
    letterSpacing: "var(--tracking-snug)",
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    transition: "background 0.16s, border-color 0.16s, transform 0.12s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    width: full ? "100%" : undefined,
    ...style,
  };

  const primary: React.CSSProperties = {
    ...base,
    background: "var(--accent)",
    color: "var(--on-accent)",
  };

  const secondary: React.CSSProperties = {
    ...base,
    background: "transparent",
    color: "var(--fg-1)",
    border: "1.5px solid var(--hairline)",
  };

  const s = variant === "primary" ? primary : secondary;

  const disabledStyle: React.CSSProperties = rest.disabled
    ? { opacity: 0.55, cursor: "default" }
    : {};

  const onMouseEnter = (e: MouseEvent<HTMLElement>) => {
    if (rest.disabled) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--accent-strong)";
    else e.currentTarget.style.borderColor = "var(--fg-3)";
  };
  const onMouseLeave = (e: MouseEvent<HTMLElement>) => {
    if (rest.disabled) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--accent)";
    else e.currentTarget.style.borderColor = "var(--hairline)";
  };
  const onMouseDown = (e: MouseEvent<HTMLElement>) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(0.98)"; };
  const onMouseUp = (e: MouseEvent<HTMLElement>) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(1)"; };

  if (href) {
    return (
      <Link
        href={href}
        style={{ ...s, ...disabledStyle, textDecoration: "none" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      style={{ ...s, ...disabledStyle }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onTouchEnd={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(1)"; }}
      onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
