"use client";
import { useState } from "react";
import type { Cell as CellValue } from "@parity/engine";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";

interface CellProps {
  value: CellValue;
  isGiven: boolean;
  isError: boolean;
  /** Zero-based grid coordinates, used to build the screen-reader label. */
  rowIndex: number;
  colIndex: number;
  size: number;
  onClick?: () => void;
}

function CellSymbol({ value, size }: { value: CellValue; size: number }) {
  if (value === 0) return <Fire size={size * 0.6} />;
  if (value === 1) return <Water size={size * 0.6} />;
  return null;
}

export function Cell({
  value,
  isGiven,
  isError,
  rowIndex,
  colIndex,
  size,
  onClick,
}: CellProps) {
  const [pressed, setPressed] = useState(false);
  const filled = value !== null;

  // e.g. "Row 2, column 3, solid, given" — position + symbol + given/error context.
  const symbolLabel = value === 0 ? "solid" : value === 1 ? "open" : "empty";
  const ariaLabel = [
    `Row ${rowIndex + 1}, column ${colIndex + 1}`,
    symbolLabel,
    isGiven ? "given" : null,
    isError ? "error" : null,
  ]
    .filter(Boolean)
    .join(", ");

  let bg = "var(--surface-raised)";
  let border = "1px solid var(--hairline)";
  let boxShadow = "none";
  let cursor = "pointer";

  if (isGiven) {
    bg = "var(--bg-sunken)";
    border = "none";
    cursor = "default";
  } else if (isError) {
    bg = "var(--wrong-tint)";
    border = "2px solid var(--wrong)";
    boxShadow = "none";
  } else if (filled) {
    bg = "var(--surface-raised)";
    border = "none";
    boxShadow = "var(--shadow-cell)";
  }

  return (
    <button
      onClick={onClick}
      disabled={isGiven}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-cell)",
        border,
        background: bg,
        boxShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor,
        transform: pressed ? "scale(0.94)" : "scale(1)",
        transition: "transform 0.12s, background 0.16s, box-shadow 0.16s",
      }}
      onMouseEnter={(e) => {
        if (!isGiven && !filled) e.currentTarget.style.background = "var(--bg-sunken)";
      }}
      onMouseLeave={(e) => {
        if (!isGiven && !filled) e.currentTarget.style.background = "var(--surface-raised)";
        setPressed(false);
      }}
      onMouseDown={() => {
        if (!isGiven) setPressed(true);
      }}
      onMouseUp={() => {
        setPressed(false);
      }}
      onTouchStart={() => {
        if (!isGiven) setPressed(true);
      }}
      onTouchEnd={() => {
        setPressed(false);
      }}
    >
      {value !== null && (
        <span style={{ animation: "cell-pop 0.16s cubic-bezier(0.4,0,0.2,1)", display: "flex" }}>
          <CellSymbol value={value} size={size} />
        </span>
      )}
    </button>
  );
}
