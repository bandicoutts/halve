"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "lg" | "sm";
  full?: boolean;
  /** Renders as a Next Link for actions that navigate. */
  href?: string | undefined;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "lg", full, href, children, className, style, disabled, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], size === "sm" && styles.small, full && styles.full, className].filter(Boolean).join(" ");

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={style}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={(event) => { if (disabled) event.preventDefault(); }}
      >
        {children}
      </Link>
    );
  }

  return <button className={classes} style={style} disabled={disabled} {...rest}>{children}</button>;
}
