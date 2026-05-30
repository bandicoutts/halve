"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Mark } from "@/components/symbols/Mark";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function solvedCount(month: ArchiveMonth): number {
  return month.days.filter((d) => d.solved).length;
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
            borderRadius: 999,
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
      <span style={{ fontSize: 11, color: "var(--fg-3)" }}>{label}</span>
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
    </div>
  );
}

// ─── Detail card ──────────────────────────────────────────────────────────────

function DetailCard({ puzzle, onPlay }: { puzzle: ArchiveDayEntry; onPlay: () => void }) {
  const [h, setH] = useState(false);
  const isSolved = puzzle.solved;
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onPlay}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        background: "var(--surface)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
        border: `1.5px solid ${h ? (isSolved ? "var(--hairline-2)" : "var(--accent)") : "var(--hairline)"}`,
        boxShadow: h ? "var(--shadow-sm)" : "none",
        transition: "border-color .15s, box-shadow .15s",
      }}
    >
      {isSolved ? (
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--correct-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckIcon size={20} color="var(--correct)" />
        </span>
      ) : (
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "2.5px solid var(--accent)",
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "-0.01em" }}
          >
            {puzzle.isToday ? "Today" : fmtDateLabel(puzzle.date)}
          </span>
          <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.04em" }}>
            #{puzzle.dayNo}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <DiffDots d={puzzle.difficulty} on />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-3)" }}>
            {puzzle.difficulty}
          </span>
        </div>
      </div>

      {isSolved && puzzle.timeMs !== undefined ? (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="tnum" style={{ fontSize: 20, fontWeight: 500, color: "var(--fg-1)", lineHeight: 1 }}>
            {fmtMs(puzzle.timeMs)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--correct)", marginTop: 5 }}>
            Solved
          </div>
        </div>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          Play <ChevronRight size={15} color="var(--accent)" />
        </span>
      )}
    </div>
  );
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

function CalCell({
  puzzle,
  selected,
  onSelect,
}: {
  puzzle: ArchiveDayEntry | null;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!puzzle) {
    return <span style={{ width: "100%", aspectRatio: "1", display: "block" }} />;
  }

  const title = `${puzzle.isToday ? "Today" : fmtDateLabel(puzzle.date)} · ${puzzle.difficulty}${puzzle.solved && puzzle.timeMs !== undefined ? " · " + fmtMs(puzzle.timeMs) : ""}`;

  return (
    <button
      onClick={onSelect}
      title={title}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.transform = "scale(1.06)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        fontFamily: "var(--font-sans)",
        background: puzzle.solved ? "var(--accent)" : "var(--bg-sunken)",
        border: selected
          ? "2px solid var(--fg-1)"
          : puzzle.isToday
          ? "2px solid var(--accent)"
          : puzzle.solved
          ? "none"
          : "1px solid var(--hairline)",
        transition: "transform .12s, box-shadow .12s",
      }}
    >
      <span
        className="tnum"
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          color: puzzle.solved
            ? "var(--on-accent)"
            : puzzle.isToday
            ? "var(--accent)"
            : "var(--fg-2)",
        }}
      >
        {puzzle.day}
      </span>
    </button>
  );
}

// ─── Month grid ───────────────────────────────────────────────────────────────

const DOW = ["S", "M", "T", "W", "T", "F", "S"] as const;

function MonthGrid({
  month,
  selectedId,
  onSelect,
}: {
  month: ArchiveMonth;
  selectedId: string;
  onSelect: (id: string) => void;
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
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
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
            selected={p?.id === selectedId}
            onSelect={() => p && onSelect(p.id)}
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
        borderRadius: 999,
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
          gap: 7,
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
            letterSpacing: "-0.01em",
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
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: "var(--fg-1)",
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="tnum"
                    style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-3)" }}
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
  const cur = months[index]!;
  return (
    <div style={{ marginBottom: 18 }}>
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
      <div
        className="tnum"
        style={{
          textAlign: "center",
          marginTop: 4,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.03em",
          color: "var(--fg-3)",
        }}
      >
        {solvedCount(cur)} / {cur.days.length} solved
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArchiveScreen({ months, initialId }: ArchiveScreenProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Find initial month index containing initialId
  const initMonthIdx = (() => {
    if (!initialId) return 0;
    const idx = months.findIndex((m) => m.days.some((d) => d.id === initialId));
    return idx >= 0 ? idx : 0;
  })();

  const [monthIdx, setMonthIdx] = useState(initMonthIdx);
  const [selectedId, setSelectedId] = useState(
    initialId ?? months[0]?.days[months[0].days.length - 1]?.id ?? ""
  );

  const selectedPuzzle = months
    .flatMap((m) => m.days)
    .find((d) => d.id === selectedId) ?? null;

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
            <span style={{ fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>
              Archive
            </span>
          }
          right={<ThemeToggle theme={theme} onToggle={toggle} />}
        />
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
                letterSpacing: "-0.01em",
                color: "var(--fg-1)",
              }}
            >
              No past puzzles yet
            </div>
            <p
              style={{
                fontSize: 14,
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

      {/* Pinned context — detail card + legend */}
      <div
        style={{
          flexShrink: 0,
          padding: "6px 24px 14px",
          background: "var(--bg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {selectedPuzzle && (
          <div style={{ marginBottom: 14 }}>
            <DetailCard
              puzzle={selectedPuzzle}
              onPlay={() => router.push(`/play/${selectedPuzzle.date}`)}
            />
          </div>
        )}
        <Legend />
      </div>

      <div style={{ height: 1, background: "var(--hairline)", flexShrink: 0 }} />

      {/* Scrollable month view */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch" as const,
          padding: "18px 24px 40px",
        }}
      >
        <MonthNav months={months} index={monthIdx} onChange={setMonthIdx} />
        <MonthGrid
          month={currentMonth}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            // If selected id is in a different month, stay — it's already the right month
          }}
        />
      </div>
    </div>
  );
}
