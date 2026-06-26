"use client";
import { memo, useState } from "react";
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
  /** Stable tap handler — Cell calls it with its own coords, keeping the prop
   *  reference stable across renders so React.memo can skip untouched cells. */
  onCellTap?: ((r: number, c: number) => void) | undefined;
  readOnly?: boolean;
  /** When set, the cell plays the solve-settle once after this delay (ms). */
  settleDelay?: number | undefined;
  /** Roving-tabindex value: 0 for the active cell, -1 for the rest. */
  tabIndex?: number;
  /** Notifies the grid which cell is focused (keeps roving tabindex in sync). */
  onFocus?: ((r: number, c: number) => void) | undefined;
  /** Edge-constraint phrase appended to the SR label. */
  edgeHint?: string | undefined;
}

function CellSymbol({ value, size }: { value: CellValue; size: number }) {
  if (value === 0) return <Fire size={size * 0.6} />;
  if (value === 1) return <Water size={size * 0.6} />;
  return null;
}

export const Cell = memo(function Cell({
  value,
  isGiven,
  isError,
  rowIndex,
  colIndex,
  size,
  onCellTap,
  readOnly,
  settleDelay,
  tabIndex,
  onFocus,
  edgeHint,
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
    edgeHint ?? null,
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
      onClick={readOnly || isGiven ? undefined : () => onCellTap?.(rowIndex, colIndex)}
      aria-disabled={isGiven || undefined}
      tabIndex={tabIndex}
      onFocus={() => onFocus?.(rowIndex, colIndex)}
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
        animation:
          settleDelay !== undefined
            ? `cell-settle var(--dur-slow) var(--ease-standard) ${settleDelay}ms`
            : undefined,
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
});
