"use client";
import type { Cell as CellValue } from "@parity/engine";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";

interface CellProps {
  value: CellValue;
  isGiven: boolean;
  isError: boolean;
  size: number;
  onClick?: () => void;
}

function CellSymbol({ value, size }: { value: CellValue; size: number }) {
  if (value === 0) return <Fire size={size * 0.6} />;
  if (value === 1) return <Water size={size * 0.6} />;
  return null;
}

export function Cell({ value, isGiven, isError, size, onClick }: CellProps) {
  const filled = value !== null;

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
      aria-label={value === 0 ? "solid" : value === 1 ? "open" : "empty"}
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
        transition: "transform 0.12s, background 0.16s, box-shadow 0.16s",
      }}
      onMouseEnter={(e) => {
        if (!isGiven && !filled) e.currentTarget.style.background = "var(--bg-sunken)";
      }}
      onMouseLeave={(e) => {
        if (!isGiven && !filled) e.currentTarget.style.background = "var(--surface-raised)";
      }}
      onMouseDown={(e) => {
        if (!isGiven) e.currentTarget.style.transform = "scale(0.94)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onTouchStart={(e) => {
        if (!isGiven) e.currentTarget.style.transform = "scale(0.94)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)";
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
