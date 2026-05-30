"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TopBar } from "@/components/ui/TopBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconButton } from "@/components/ui/IconButton";
import { Eyebrow } from "@/components/ui/Eyebrow";

export interface ArchivePuzzle {
  id: string;
  date: string;
  difficulty: "easy" | "medium" | "hard";
  dayNo: number;
  solved: boolean;
}

export interface ArchiveScreenProps {
  today: ArchivePuzzle | null;
  past: ArchivePuzzle[];
}

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--correct)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year!, month! - 1, day!);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function monthLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year!, month! - 1, day!);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupByMonth(puzzles: ArchivePuzzle[]): { label: string; puzzles: ArchivePuzzle[] }[] {
  const map = new Map<string, ArchivePuzzle[]>();
  for (const p of puzzles) {
    const label = monthLabel(p.date);
    const existing = map.get(label);
    if (existing) {
      existing.push(p);
    } else {
      map.set(label, [p]);
    }
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, puzzles: items }));
}

function PuzzleRow({ puzzle }: { puzzle: ArchivePuzzle }) {
  return (
    <Link
      href={`/play/${puzzle.date}`}
      style={{ textDecoration: "none", display: "block" }}
      onTouchStart={(e) => { e.currentTarget.style.opacity = "0.65"; }}
      onTouchEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
      onTouchCancel={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 0",
          borderBottom: "1px solid var(--hairline)",
          gap: 12,
        }}
      >
        <span
          className="tnum"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--fg-3)",
            letterSpacing: "0.04em",
            minWidth: 36,
          }}
        >
          #{puzzle.dayNo}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-1)" }}>
            {formatDateLabel(puzzle.date)}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--fg-3)",
              marginTop: 2,
            }}
          >
            {puzzle.difficulty}
          </div>
        </div>
        {puzzle.solved && <CheckIcon />}
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--fg-3)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

export function ArchiveScreen({ today, past }: ArchiveScreenProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const groups = groupByMonth(past);

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

      <div style={{ flex: 1, padding: "0 24px", overflowY: "auto" }}>
        {today && (
          <div style={{ marginBottom: 32 }}>
            <Eyebrow style={{ marginBottom: 14 }}>Today</Eyebrow>
            <PuzzleRow puzzle={{ ...today, solved: today.solved }} />
          </div>
        )}

        {groups.length === 0 && !today && (
          <p style={{ fontSize: 15, color: "var(--fg-3)", marginTop: 24 }}>
            No past puzzles yet.
          </p>
        )}

        {groups.map(({ label, puzzles }) => (
          <div key={label} style={{ marginBottom: 32 }}>
            <Eyebrow style={{ marginBottom: 14 }}>{label}</Eyebrow>
            <div>
              {puzzles.map((p) => (
                <PuzzleRow key={p.id} puzzle={p} />
              ))}
            </div>
          </div>
        ))}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
