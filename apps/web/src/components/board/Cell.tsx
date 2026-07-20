"use client";
import { memo } from "react";
import type { Cell as CellValue, EdgeKind, EdgeOrientation } from "@parity/engine";

interface CellProps {
  value: CellValue;
  isGiven: boolean;
  isError: boolean;
  /** Zero-based grid coordinates, used to build the screen-reader label. */
  rowIndex: number;
  colIndex: number;
  /** Grid size — drives the internal hairlines (no border on the last row/col). */
  n: number;
  /** Stable tap handler — Cell calls it with its own coords, keeping the prop
   *  reference stable across renders so React.memo can skip untouched cells. */
  onCellTap?: ((r: number, c: number) => void) | undefined;
  readOnly?: boolean;
  /** When set, the placed symbol plays the solve wave once after this delay (ms). */
  settleDelay?: number | undefined;
  /** Roving-tabindex value: 0 for the active cell, -1 for the rest. */
  tabIndex?: number;
  /** Notifies the grid which cell is focused (keeps roving tabindex in sync). */
  onFocus?: ((r: number, c: number) => void) | undefined;
  /** Edge-constraint phrase appended to the SR label. */
  edgeHint?: string | undefined;
  /** Edge cap owned by this cell (drawn straddling its right/bottom edge). */
  edge?: { kind: EdgeKind; orientation: EdgeOrientation } | undefined;
}

/** Shared style for the two symbol layers — both are always mounted and the
 *  active one fades/scales in, matching the prototype's tactile placement. */
function symLayer(show: boolean, settleDelay: number | undefined): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    pointerEvents: "none",
    opacity: show ? 1 : 0,
    transform: show ? "scale(1)" : "scale(0.45)",
    transition: "transform 0.26s var(--ease-out-back), opacity 0.13s ease",
    animation: settleDelay !== undefined && show ? `solvepop 0.7s var(--ease-out-back) ${settleDelay}ms both` : undefined,
  };
}

const CAP_GLYPH: Record<EdgeKind, string> = { eq: "=", ne: "≠" };

const capBase: React.CSSProperties = {
  position: "absolute",
  zIndex: 4,
  minWidth: 25,
  height: 25,
  padding: "0 5px",
  borderRadius: 999,
  background: "var(--bg)",
  border: "1px solid var(--hairline)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  pointerEvents: "none",
};

export const Cell = memo(function Cell({
  value,
  isGiven,
  isError,
  rowIndex,
  colIndex,
  n,
  onCellTap,
  readOnly,
  settleDelay,
  tabIndex,
  onFocus,
  edgeHint,
  edge,
}: CellProps) {
  // e.g. "Row 2, column 3, disc, given" — position + symbol + given/error context.
  const symbolLabel = value === 0 ? "disc" : value === 1 ? "ring" : "empty";
  const ariaLabel = [
    `Row ${rowIndex + 1}, column ${colIndex + 1}`,
    symbolLabel,
    isGiven ? "given" : null,
    isError ? "error" : null,
    edgeHint ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  const interactive = !isGiven && !readOnly;

  return (
    <button
      onClick={interactive ? () => onCellTap?.(rowIndex, colIndex) : undefined}
      aria-disabled={isGiven || undefined}
      tabIndex={tabIndex}
      onFocus={() => onFocus?.(rowIndex, colIndex)}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        border: "none",
        font: "inherit",
        color: "inherit",
        background: "transparent",
        padding: 0,
        margin: 0,
        width: "100%",
        height: "100%",
        cursor: interactive ? "pointer" : "default",
        borderRight: colIndex < n - 1 ? "1px solid var(--hairline)" : "none",
        borderBottom: rowIndex < n - 1 ? "1px solid var(--hairline)" : "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.background = "var(--hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Given plate — a soft rounded fill marking the fixed clues */}
      <div
        style={{
          position: "absolute",
          inset: "9%",
          borderRadius: 12,
          zIndex: 1,
          pointerEvents: "none",
          background: isGiven ? "var(--plate)" : "transparent",
        }}
      />

      {/* Symbol layers */}
      <div style={symLayer(value === 0, settleDelay)}>
        <svg viewBox="0 0 40 40" style={{ width: "56%", height: "56%" }} aria-hidden="true">
          <circle cx="20" cy="20" r="15" fill="var(--symbol-a)" />
        </svg>
      </div>
      <div style={symLayer(value === 1, settleDelay)}>
        <svg viewBox="0 0 40 40" style={{ width: "56%", height: "56%" }} aria-hidden="true">
          <circle cx="20" cy="20" r="13" fill="none" stroke="var(--symbol-b)" strokeWidth="5" />
        </svg>
      </div>

      {/* Violation marker — a small dot under the symbol */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "8%",
          transform: "translateX(-50%)",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--err)",
          zIndex: 3,
          opacity: isError ? 1 : 0,
          transition: "opacity 0.25s ease",
          pointerEvents: "none",
        }}
      />

      {/* Edge cap — the = / ≠ constraint straddling the shared edge */}
      {edge && (
        <div
          aria-hidden="true"
          style={
            edge.orientation === "h"
              ? { ...capBase, right: 0, top: "50%", transform: "translate(50%, -50%)" }
              : { ...capBase, bottom: 0, left: "50%", transform: "translate(-50%, 50%)" }
          }
        >
          {CAP_GLYPH[edge.kind]}
        </div>
      )}
    </button>
  );
});
