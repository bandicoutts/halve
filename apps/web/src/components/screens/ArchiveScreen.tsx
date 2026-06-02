"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Mark } from "@/components/symbols/Mark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatDuration } from "@/lib/format";
import { formatDateLabel } from "@/lib/local-date";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArchiveDayEntry {
  id: string;
  date: string;
  day: number;
  dayNo: number;
  difficulty: "easy" | "medium" | "hard";
  isToday: boolean;
  solved: boolean;
  timeMs?: number;
}

export interface ArchiveMonth {
  label: string;
  year: number;
  monthIdx: number;
  days: ArchiveDayEntry[];
}

export interface ArchiveScreenProps {
  months: ArchiveMonth[];
  initialId?: string;
}

// ─── Layout constants ──────────────────────────────────────────────────────────

/** Calendar day-cell height. Shorter than square — a single number doesn't need
 *  a 1:1 box; this trims ~25% off the grid's vertical footprint. */
const CELL_H = 42;
/** Max content width. Keeps the calendar from ballooning to giant squares on
 *  desktop; content stays centered, full-bleed padding remains on mobile. */
const CONTENT_MAX = 460;

// ─── Helpers ─────────────────────────────────────────────────────────────────


function solvedCount(month: ArchiveMonth): number {
  return month.days.filter((d) => d.solved).length;
}

interface MonthStats {
  solved: number;
  total: number;
  avgMs?: number;
  bestMs?: number;
}

function monthStats(month: ArchiveMonth): MonthStats {
  const times = month.days
    .filter((d) => d.solved && d.timeMs !== undefined)
    .map((d) => d.timeMs as number);
  return {
    solved: month.days.filter((d) => d.solved).length,
    total: month.days.length,
    avgMs: times.length
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : undefined,
    bestMs: times.length ? Math.min(...times) : undefined,
  };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon({ size = 20, color = "var(--correct)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronRight({ size = 15, color = "var(--accent)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDown({ size = 16, color = "var(--fg-2)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Difficulty dots ──────────────────────────────────────────────────────────

function DiffDots({ d, on = false }: { d: "easy" | "medium" | "hard"; on?: boolean }) {
  const n = d === "easy" ? 1 : d === "medium" ? 2 : 3;
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "var(--radius-full)",
            background: i <= n ? (on ? "var(--accent)" : "var(--fg-2)") : "transparent",
            border: i <= n ? "none" : "1.5px solid var(--hairline-2)",
          }}
        />
      ))}
    </span>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const item = (node: React.ReactNode, label: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {node}
      <span style={{ fontSize: "var(--text-label)", color: "var(--fg-3)" }}>{label}</span>
    </span>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      {item(
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--accent)", display: "inline-block" }} />,
        "Solved"
      )}
      {item(
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--bg-sunken)", border: "1px solid var(--hairline)", display: "inline-block" }} />,
        "Not solved"
      )}
      {item(
        <span style={{ width: 14, height: 14, borderRadius: 4, background: "var(--bg-sunken)", border: "2px solid var(--accent)", display: "inline-block" }} />,
        "Today"
      )}
      {item(
        <span style={{ display: "inline-flex", gap: 2.5, alignItems: "center" }}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{ width: 3, height: 3, borderRadius: "var(--radius-full)", background: "var(--fg-3)" }} />
          ))}
        </span>,
        "Difficulty"
      )}
    </div>
  );
}

// ─── Month summary ──────────────────────────────────────────────────────────

/** A "label · value" cluster for the summary row. */
function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
      <span
        className="tnum"
        style={{ fontSize: "var(--text-small)", fontWeight: 600, color: "var(--fg-1)" }}
      >
        {value}
      </span>
      <Eyebrow as="span">{label}</Eyebrow>
    </span>
  );
}

/** Always-populated progress strip for the visible month. Replaces the old
 *  per-puzzle detail card — reads from the month in view, so it can't go stale. */
function MonthSummary({ stats }: { stats: MonthStats }) {
  const dot = (
    <span aria-hidden style={{ color: "var(--hairline-2)", fontSize: "var(--text-label)" }}>
      ·
    </span>
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <SummaryStat label="solved" value={`${stats.solved} / ${stats.total}`} />
      {stats.avgMs !== undefined && (
        <>
          {dot}
          <SummaryStat label="avg" value={formatDuration(stats.avgMs)} />
        </>
      )}
      {stats.bestMs !== undefined && (
        <>
          {dot}
          <SummaryStat label="best" value={formatDuration(stats.bestMs)} />
        </>
      )}
    </div>
  );
}

// ─── Hover preview (desktop only) ─────────────────────────────────────────────

interface HoverState {
  puzzle: ArchiveDayEntry;
  rect: { left: number; top: number; bottom: number; width: number };
}

/** Floating, non-interactive preview anchored to a calendar cell. Shown only on
 *  hover-capable pointers; on touch the cell tap navigates straight to play. */
function HoverPreview({ hover }: { hover: HoverState }) {
  const { puzzle, rect } = hover;
  // Flip below the cell when too close to the top of the viewport.
  const above = rect.top > 132;
  const top = above ? rect.top - 10 : rect.bottom + 10;
  const left = rect.left + rect.width / 2;
  const solvedTime =
    puzzle.solved && puzzle.timeMs !== undefined ? formatDuration(puzzle.timeMs) : null;
  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        transform: `translate(-50%, ${above ? "-100%" : "0"})`,
        zIndex: 50,
        pointerEvents: "none",
        background: "var(--surface-raised)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "10px 13px",
        minWidth: 150,
        animation: "fade-up 0.12s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{ fontSize: "var(--text-small)", fontWeight: 600, color: "var(--fg-1)", letterSpacing: "var(--tracking-snug)" }}
        >
          {puzzle.isToday ? "Today" : formatDateLabel(puzzle.date)}
        </span>
        <span
          className="tnum"
          style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.04em" }}
        >
          #{puzzle.dayNo}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <DiffDots d={puzzle.difficulty} on />
        <Eyebrow as="span">{puzzle.difficulty}</Eyebrow>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--hairline)",
        }}
      >
        {solvedTime ? (
          <>
            <CheckIcon size={14} color="var(--correct)" />
            <span style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--correct)" }}>
              Solved
            </span>
            <span className="tnum" style={{ fontSize: "var(--text-label)", color: "var(--fg-2)", marginLeft: "auto" }}>
              {solvedTime}
            </span>
          </>
        ) : (
          <span
            style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            Play <ChevronRight size={14} color="var(--accent)" />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

function CalCell({
  puzzle,
  onPlay,
  onHover,
  onLeave,
}: {
  puzzle: ArchiveDayEntry | null;
  onPlay: () => void;
  onHover: (h: HoverState) => void;
  onLeave: () => void;
}) {
  if (!puzzle) {
    return <span style={{ width: "100%", height: CELL_H, display: "block" }} />;
  }

  const enter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1.06)";
    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    const r = e.currentTarget.getBoundingClientRect();
    onHover({
      puzzle,
      rect: { left: r.left, top: r.top, bottom: r.bottom, width: r.width },
    });
  };
  const leave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "none";
    onLeave();
  };

  const numColor = puzzle.solved
    ? "var(--on-accent)"
    : puzzle.isToday
    ? "var(--accent)"
    : "var(--fg-2)";
  // Pips are dimmer than the number so they read as a secondary signal.
  const pipColor = puzzle.solved ? "var(--on-accent)" : "var(--fg-3)";
  const pipCount = puzzle.difficulty === "easy" ? 1 : puzzle.difficulty === "medium" ? 2 : 3;

  return (
    <button
      onClick={onPlay}
      aria-label={`Play ${puzzle.isToday ? "today" : formatDateLabel(puzzle.date)}, ${puzzle.difficulty}${puzzle.solved && puzzle.timeMs !== undefined ? `, solved in ${formatDuration(puzzle.timeMs)}` : ""}`}
      onMouseEnter={enter}
      onMouseLeave={leave}
      style={{
        position: "relative",
        width: "100%",
        height: CELL_H,
        borderRadius: "var(--radius-sm)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: "pointer",
        padding: 0,
        fontFamily: "var(--font-sans)",
        background: puzzle.solved ? "var(--accent)" : "var(--bg-sunken)",
        // A solved "today" is accent-on-accent — its accent ring would vanish,
        // so switch to a high-contrast ring there to keep the today marker.
        border: puzzle.isToday
          ? `2px solid ${puzzle.solved ? "var(--fg-1)" : "var(--accent)"}`
          : puzzle.solved
          ? "none"
          : "1px solid var(--hairline)",
        transition: "transform .12s, box-shadow .12s",
      }}
    >
      <span
        className="tnum"
        style={{
          fontSize: "var(--text-small)",
          fontWeight: 600,
          lineHeight: 1,
          color: numColor,
        }}
      >
        {puzzle.day}
      </span>
      <span aria-hidden style={{ display: "flex", gap: 2.5 }}>
        {Array.from({ length: pipCount }, (_, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 3,
              borderRadius: "var(--radius-full)",
              background: pipColor,
              opacity: puzzle.solved ? 0.7 : 1,
            }}
          />
        ))}
      </span>
    </button>
  );
}

// ─── Month grid ───────────────────────────────────────────────────────────────

const DOW = ["S", "M", "T", "W", "T", "F", "S"] as const;

function MonthGrid({
  month,
  onPlay,
  onHover,
  onLeave,
}: {
  month: ArchiveMonth;
  onPlay: (date: string) => void;
  onHover: (h: HoverState) => void;
  onLeave: () => void;
}) {
  const firstWeekday = new Date(month.year, month.monthIdx, 1).getDay();
  const cells: (ArchiveDayEntry | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...month.days,
  ];
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          marginBottom: 6,
        }}
      >
        {DOW.map((d, i) => (
          <span
            key={i}
            style={{
              textAlign: "center",
              fontSize: "var(--text-label)",
              fontWeight: 600,
              letterSpacing: "var(--tracking-label)",
              color: "var(--fg-3)",
            }}
          >
            {d}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
        }}
      >
        {cells.map((p, i) => (
          <CalCell
            key={i}
            puzzle={p}
            onPlay={() => p && onPlay(p.date)}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Month navigation ─────────────────────────────────────────────────────────

function NavArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.color = "var(--fg-1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = disabled ? "var(--hairline-2)" : "var(--fg-2)";
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: "var(--radius-full)",
        flexShrink: 0,
        border: "1.5px solid var(--hairline-2)",
        background: "transparent",
        color: disabled ? "var(--hairline-2)" : "var(--fg-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.16s",
      }}
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: dir === "next" ? "scaleX(-1)" : "none" }}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

function MonthPicker({
  months,
  index,
  onPick,
}: {
  months: ArchiveMonth[];
  index: number;
  onPick: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = months[index]!;
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          background: open ? "var(--bg-sunken)" : "transparent",
          fontFamily: "var(--font-sans)",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "var(--tracking-snug)",
            color: "var(--fg-1)",
            whiteSpace: "nowrap",
          }}
        >
          {cur.label}
        </span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.18s",
            display: "inline-flex",
          }}
        >
          <ChevronDown />
        </span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 30 }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 31,
              width: 200,
              maxHeight: 264,
              overflowY: "auto",
              background: "var(--surface-raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: 6,
            }}
          >
            {months.map((m, i) => {
              const active = i === index;
              return (
                <button
                  key={m.label}
                  onClick={() => {
                    onPick(i);
                    setOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "var(--bg-sunken)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: active ? "var(--bg-sunken)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-small)",
                      fontWeight: active ? 600 : 500,
                      color: "var(--fg-1)",
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="tnum"
                    style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--fg-3)" }}
                  >
                    {solvedCount(m)}/{m.days.length}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MonthNav({
  months,
  index,
  onChange,
}: {
  months: ArchiveMonth[];
  index: number;
  onChange: (i: number) => void;
}) {
  const atNewest = index === 0;
  const atOldest = index === months.length - 1;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <NavArrow
        dir="prev"
        disabled={atOldest}
        onClick={() => onChange(index + 1)}
      />
      <MonthPicker months={months} index={index} onPick={onChange} />
      <NavArrow
        dir="next"
        disabled={atNewest}
        onClick={() => onChange(index - 1)}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArchiveScreen({ months, initialId }: ArchiveScreenProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Find initial month index containing initialId (today, or most recent).
  const initMonthIdx = (() => {
    if (!initialId) return 0;
    const idx = months.findIndex((m) => m.days.some((d) => d.id === initialId));
    return idx >= 0 ? idx : 0;
  })();

  const [monthIdx, setMonthIdx] = useState(initMonthIdx);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Hover preview is desktop-only — gate on a hover-capable, fine pointer so a
  // touch tap (which fires synthetic mouse events) never flashes a preview.
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const play = (date: string) => router.push(`/play/${date}`);

  if (months.length === 0) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
        }}
      >
        <TopBar
          left={
            <IconButton label="Back" size={40} onClick={() => router.push("/")}>
              <BackIcon />
            </IconButton>
          }
          title={
            <span style={{ fontWeight: 600, fontSize: "var(--text-body)", color: "var(--fg-1)" }}>
              Archive
            </span>
          }
          right={<ThemeToggle theme={theme} onToggle={toggle} />}
        />
        <h1 className="sr-only">Archive</h1>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px 48px",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 300 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 18,
                opacity: 0.55,
              }}
            >
              <Mark size={36} />
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "var(--tracking-snug)",
                color: "var(--fg-1)",
              }}
            >
              No past puzzles yet
            </div>
            <p
              style={{
                fontSize: "var(--text-small)",
                lineHeight: 1.5,
                color: "var(--fg-3)",
                margin: "8px 0 0",
              }}
            >
              Solved puzzles collect here. Play today&rsquo;s board and it&rsquo;ll
              be the first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentMonth = months[monthIdx]!;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <TopBar
        left={
          <IconButton label="Back" size={40} onClick={() => router.push("/")}>
            <BackIcon />
          </IconButton>
        }
        title={
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>
            Archive
          </span>
        }
        right={<ThemeToggle theme={theme} onToggle={toggle} />}
      />

      <h1 className="sr-only">Archive</h1>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch" as const,
          padding: "14px 24px 40px",
        }}
      >
        <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
          <MonthNav months={months} index={monthIdx} onChange={setMonthIdx} />
          <div style={{ marginTop: 6, marginBottom: 18 }}>
            <MonthSummary stats={monthStats(currentMonth)} />
          </div>
          <MonthGrid
            month={currentMonth}
            onPlay={play}
            onHover={setHover}
            onLeave={() => setHover(null)}
          />
          <div
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: "var(--text-label)",
              color: "var(--fg-3)",
            }}
          >
            {canHover ? "Click any day to play" : "Tap any day to play"}
          </div>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <Legend />
          </div>
        </div>
      </div>

      {canHover && hover && <HoverPreview hover={hover} />}
    </div>
  );
}
