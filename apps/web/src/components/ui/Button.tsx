"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  full?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", full, children, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    height: 52,
    borderRadius: "var(--radius-full)",
    padding: "0 28px",
    fontSize: "var(--text-body)",
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

  return (
    <button
      style={{ ...s, ...disabledStyle }}
      onMouseEnter={(e) => {
        if (rest.disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--accent-strong)";
        else e.currentTarget.style.borderColor = "var(--fg-3)";
      }}
      onMouseLeave={(e) => {
        if (rest.disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--accent)";
        else e.currentTarget.style.borderColor = "var(--hairline)";
      }}
      onMouseDown={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(1)"; }}
      onTouchStart={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onTouchEnd={(e) => { if (!rest.disabled) e.currentTarget.style.transform = "scale(1)"; }}
      onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
