"use client";
import { useState } from "react";

interface GhostLinkProps {
  children: React.ReactNode;
  onClick?: () => void;
  strong?: boolean;
  style?: React.CSSProperties;
}

export function GhostLink({ children, onClick, strong, style }: GhostLinkProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-small)",
        fontWeight: strong ? 600 : 500,
        color: hovered ? "var(--fg-1)" : "var(--fg-2)",
        cursor: "pointer",
        padding: "10px 8px",
        minHeight: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color .15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
