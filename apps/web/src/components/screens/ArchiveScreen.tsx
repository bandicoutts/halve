"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { Mark } from "@/components/symbols/Mark";
import { Button } from "@/components/ui/Button";
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
  initialId?: string | undefined;
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

// ─── Legend ───────────────────────────────────────────────────────────────────

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {swatch}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--fg-3)" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Nav arrow ────────────────────────────────────────────────────────────────

function NavArrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        flex: "none",
        border: "1px solid var(--hairline)",
        background: "none",
        color: "inherit",
        fontSize: 16,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.3 : 1,
        transition: "border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--hairline)";
        e.currentTarget.style.color = "inherit";
      }}
    >
      {dir === "prev" ? "←" : "→"}
    </button>
  );
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

function DayCell({ entry, onPlay }: { entry: ArchiveDayEntry; onPlay: () => void }) {
  const base: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "clamp(12px, 2.2vw, 14px)",
    fontVariantNumeric: "tabular-nums",
    padding: 0,
    background: "transparent",
    border: "1.5px solid transparent",
    color: "var(--fg-1)",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.15s ease, background 0.15s ease",
    WebkitTapHighlightColor: "transparent",
  };

  let style = base;
  if (entry.isToday) {
    style = entry.solved
      ? { ...base, background: "var(--accent)", color: "var(--on-accent)", fontWeight: 600, border: "2px solid var(--symbol-b)" }
      : { ...base, border: "2px solid var(--symbol-b)" };
  } else if (entry.solved) {
    style = { ...base, background: "var(--accent)", color: "var(--on-accent)", fontWeight: 600 };
  } else {
    style = { ...base, border: "1.5px solid var(--hairline)" };
  }

  return (
    <button
      onClick={onPlay}
      aria-label={`Play ${entry.isToday ? "today" : formatDateLabel(entry.date)}, ${entry.difficulty}${entry.solved ? ", solved" : ""}`}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {entry.day}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyArchive({
  isAuthenticated,
  displayName,
}: {
  isAuthenticated?: boolean | undefined;
  displayName?: string | undefined;
}) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader active="archive" isAuthenticated={isAuthenticated} displayName={displayName} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 64px" }}>
        <div style={{ textAlign: "center", maxWidth: 340 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, opacity: 0.6 }}>
            <Mark size={36} />
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: 34, margin: 0 }}>
            The back catalogue.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "var(--fg-3)", margin: "12px 0 0 0" }}>
            Every daily is kept here. Play today&rsquo;s board and it&rsquo;ll be the first.
          </p>
          <div style={{ marginTop: 22 }}>
            <Button href="/play">Play today</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ArchiveScreen({ months, initialId, isAuthenticated, displayName }: ArchiveScreenProps) {
  const router = useRouter();

  const initMonthIdx = (() => {
    if (!initialId) return 0;
    const idx = months.findIndex((m) => m.days.some((d) => d.id === initialId));
    return idx >= 0 ? idx : 0;
  })();

  const [monthIdx, setMonthIdx] = useState(initMonthIdx);

  if (months.length === 0) {
    return <EmptyArchive isAuthenticated={isAuthenticated} displayName={displayName} />;
  }

  const month = months[monthIdx]!;
  const atNewest = monthIdx === 0;
  const atOldest = monthIdx === months.length - 1;
  const sinceLabel = months[months.length - 1]!.label.toUpperCase();
  const firstNo = month.days[0]?.dayNo;
  const lastNo = month.days[month.days.length - 1]?.dayNo;

  // Monday-first offset for the leading blank cells.
  const offset = (new Date(month.year, month.monthIdx, 1).getDay() + 6) % 7;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <SiteHeader active="archive" isAuthenticated={isAuthenticated} displayName={displayName} />
      <h1 className="sr-only">Archive</h1>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(36px, 6vw, 88px)",
          maxWidth: 1140,
          width: "100%",
          margin: "0 auto",
          padding: "8px clamp(20px, 4vw, 40px) 64px",
          animation: "fadeup 0.45s var(--ease-editorial) both",
        }}
      >
        {/* Left — intro + legend */}
        <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>
            ARCHIVE · SINCE {sinceLabel}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(48px, 7vw, 88px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            The back
            <br />
            catalogue.
          </div>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--fg-3)", maxWidth: "38ch" }}>
            Every daily is kept here. Pick any day you missed, or replay an old favourite.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderTop: "1px solid var(--hairline)",
              paddingTop: 20,
              width: "fit-content",
            }}
          >
            <LegendRow
              swatch={
                <svg viewBox="0 0 20 20" style={{ width: 12, height: 12, flex: "none" }}>
                  <circle cx="10" cy="10" r="7.5" fill="var(--accent)" />
                </svg>
              }
              label="SOLVED"
            />
            <LegendRow
              swatch={
                <svg viewBox="0 0 20 20" style={{ width: 12, height: 12, flex: "none" }}>
                  <circle cx="10" cy="10" r="6.5" fill="none" stroke="var(--hairline-2)" strokeWidth="2" />
                </svg>
              }
              label="UNSOLVED · OPEN TO PLAY"
            />
            <LegendRow
              swatch={
                <svg viewBox="0 0 20 20" style={{ width: 12, height: 12, flex: "none" }}>
                  <circle cx="10" cy="10" r="6.5" fill="none" stroke="var(--symbol-b)" strokeWidth="2.5" />
                </svg>
              }
              label="TODAY'S PUZZLE"
            />
          </div>
        </div>

        {/* Right — calendar */}
        <div
          style={{
            flex: "1 1 400px",
            maxWidth: 560,
            width: "100%",
            minWidth: "min(100%, 320px)",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <NavArrow dir="prev" disabled={atOldest} onClick={() => setMonthIdx((i) => i + 1)} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: "clamp(26px, 4vw, 34px)",
                  lineHeight: 1,
                }}
              >
                {month.label}
              </span>
              {firstNo !== undefined && lastNo !== undefined && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", color: "var(--fg-3)" }}>
                  NO. {firstNo} – {lastNo}
                </span>
              )}
            </div>
            <NavArrow dir="next" disabled={atNewest} onClick={() => setMonthIdx((i) => i - 1)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "clamp(4px, 1.2vw, 10px)" }}>
            {WEEKDAYS.map((w, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "var(--fg-3)",
                  paddingBottom: 4,
                }}
              >
                {w}
              </div>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {month.days.map((entry) => (
              <DayCell key={entry.id} entry={entry} onPlay={() => router.push(`/play/${entry.date}`)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
