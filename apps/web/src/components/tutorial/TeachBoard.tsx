"use client";
import { Fire } from "@/components/symbols/Fire";
import { Water } from "@/components/symbols/Water";
import { EdgeSign } from "@/components/symbols/EdgeSign";

type CellValue = 0 | 1 | null;
type Grid2D = CellValue[][];

// ─── GoodBad badge ────────────────────────────────────────────────────────────

export function GoodBad({ good, size = 22 }: { good: boolean; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: good ? "var(--correct-tint)" : "var(--wrong-tint)",
        color: good ? "var(--correct)" : "var(--wrong)",
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {good ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        )}
      </svg>
    </span>
  );
}

// ─── TeachCell ────────────────────────────────────────────────────────────────

interface TeachCellProps {
  value: CellValue;
  size?: number;
  given?: boolean;
  state?: "bad" | "good" | null;
  highlight?: boolean;
  dimmed?: boolean;
  animate?: boolean;
  delay?: number;
  onTap?: () => void;
}

function TeachCell({
  value,
  size = 52,
  given,
  state = null,
  highlight = false,
  dimmed = false,
  animate = false,
  delay = 0,
  onTap,
}: TeachCellProps) {
  const filled = value === 0 || value === 1;
  const bg =
    state === "bad"
      ? "var(--wrong-tint)"
      : state === "good"
      ? "var(--correct-tint)"
      : filled
      ? "var(--surface)"
      : "var(--bg-sunken)";
  const border =
    state === "bad"
      ? "1.5px solid var(--wrong)"
      : state === "good"
      ? "1.5px solid var(--correct)"
      : highlight
      ? "2px solid var(--accent)"
      : filled
      ? "1px solid var(--hairline)"
      : "1.5px solid var(--hairline-2)";

  return (
    <button
      onClick={onTap}
      disabled={!onTap}
      aria-label={filled ? (value === 0 ? "solid" : "ring") : "empty"}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-cell)",
        background: bg,
        border,
        padding: 0,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onTap ? "pointer" : "default",
        fontFamily: "var(--font-sans)",
        opacity: dimmed ? 0.3 : 1,
        boxShadow:
          given && filled && !state ? "inset 0 0 0 1.5px var(--hairline-2)" : "none",
        transition: "opacity .2s, background .18s, border-color .18s",
        animation:
          animate && filled
            ? "cell-pop .34s cubic-bezier(0.4,0,0.2,1) both"
            : "none",
        animationDelay: animate ? `${delay}ms` : undefined,
      }}
    >
      {value === 0 && <Fire size={size * 0.6} fill="var(--symbol-a)" />}
      {value === 1 && <Water size={size * 0.6} fill="var(--symbol-b)" />}
    </button>
  );
}

// ─── TeachBoard ───────────────────────────────────────────────────────────────

export interface TeachBoardProps {
  cells: Grid2D;
  n?: number;
  size?: number;
  gap?: number;
  givens?: Record<string, boolean>;
  hEdges?: Record<string, "eq" | "ne">;
  vEdges?: Record<string, "eq" | "ne">;
  states?: Record<string, "bad" | "good">;
  highlight?: string[];
  focusEdges?: boolean;
  animate?: boolean;
  onTap?: (r: number, c: number) => void;
}

export function TeachBoard({
  cells,
  n = 4,
  size = 52,
  gap = 24,
  givens = {},
  hEdges = {},
  vEdges = {},
  states = {},
  highlight = [],
  focusEdges = false,
  animate = false,
  onTap,
}: TeachBoardProps) {
  const hiSet = new Set(highlight);
  const focusing = highlight.length > 0 || focusEdges;
  const G = 2 * n - 1;

  const trackParts: string[] = [];
  for (let i = 0; i < n; i++) {
    trackParts.push(`${size}px`);
    if (i < n - 1) trackParts.push(`${gap}px`);
  }
  const template = trackParts.join(" ");

  const slots: React.ReactNode[] = [];
  for (let gr = 0; gr < G; gr++) {
    for (let gc = 0; gc < G; gc++) {
      const cellRow = gr % 2 === 0;
      const cellCol = gc % 2 === 0;
      const key = `${gr}-${gc}`;

      if (cellRow && cellCol) {
        const r = gr / 2;
        const c = gc / 2;
        const k = `${r},${c}`;
        slots.push(
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <TeachCell
              value={cells[r]?.[c] ?? null}
              size={size}
              given={!!givens[k]}
              state={states[k] ?? null}
              highlight={hiSet.has(k)}
              dimmed={focusing && !hiSet.has(k) && !focusEdges}
              animate={animate}
              delay={(r * n + c) * 26}
              onTap={onTap ? () => onTap(r, c) : undefined}
            />
          </div>
        );
      } else if (cellRow && !cellCol) {
        const r = gr / 2;
        const c = (gc - 1) / 2;
        const sign = hEdges[`${r},${c}`];
        slots.push(
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {sign && (
              <span
                style={{
                  transform: focusEdges ? "scale(1.08)" : "none",
                  transition: "transform .2s",
                  opacity: focusing && !focusEdges ? 0.3 : 1,
                }}
              >
                <EdgeSign sign={sign} size={Math.min(gap, 22)} />
              </span>
            )}
          </div>
        );
      } else if (!cellRow && cellCol) {
        const r = (gr - 1) / 2;
        const c = gc / 2;
        const sign = vEdges[`${r},${c}`];
        slots.push(
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {sign && (
              <span
                style={{
                  transform: focusEdges ? "scale(1.08)" : "none",
                  transition: "transform .2s",
                  opacity: focusing && !focusEdges ? 0.3 : 1,
                }}
              >
                <EdgeSign sign={sign} size={Math.min(gap, 22)} />
              </span>
            )}
          </div>
        );
      } else {
        slots.push(<div key={key} />);
      }
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        gridTemplateRows: template,
        justifyContent: "center",
        margin: "0 auto",
        width: "max-content",
      }}
    >
      {slots}
    </div>
  );
}
