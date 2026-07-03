"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generatePuzzle } from "@parity/engine";
import { useGame } from "@/hooks/useGame";
import { Board } from "@/components/board/Board";
import { HEADER_BAR, Wordmark } from "@/components/ui/Wordmark";

// ─── Illustration helpers ─────────────────────────────────────────────────────

function Disc({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" style={{ width: size, height: size }} aria-hidden="true">
      <circle cx="20" cy="20" r="15" style={{ fill: "var(--symbol-a)" }} />
    </svg>
  );
}
function Ring({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" style={{ width: size, height: size }} aria-hidden="true">
      <circle cx="20" cy="20" r="13" style={{ fill: "none", stroke: "var(--symbol-b)", strokeWidth: 5 }} />
    </svg>
  );
}

const monoLabel: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--fg-3)" };

function Beat1Art() {
  return (
    <div style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(32px,6vw,64px)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Disc size={120} />
        <span style={monoLabel}>DISC</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Ring size={120} />
        <span style={monoLabel}>RING</span>
      </div>
    </div>
  );
}

function EdgePair({ right, glyph, label }: { right: "disc" | "ring"; glyph: string; label: string }) {
  const cellStyle: React.CSSProperties = { width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", position: "relative", border: "1px solid var(--hairline)" }}>
        <div style={{ ...cellStyle, borderRight: "1px solid var(--hairline)" }}>
          <Disc size={54} />
        </div>
        <div style={cellStyle}>{right === "disc" ? <Disc size={54} /> : <Ring size={54} />}</div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            minWidth: 27,
            height: 27,
            padding: "0 5px",
            borderRadius: 999,
            background: "var(--bg)",
            border: "1px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {glyph}
        </div>
      </div>
      <span style={monoLabel}>{label}</span>
    </div>
  );
}

function Beat2Art() {
  return (
    <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44 }}>
      <EdgePair right="disc" glyph="=" label="= PAIR MATCHES" />
      <EdgePair right="ring" glyph="≠" label="≠ PAIR DIFFERS" />
    </div>
  );
}

function StripCell({ v, bad }: { v: 0 | 1 | null; bad?: boolean }) {
  // Fluid so the 6-cell strip never overflows narrow phones (was 60px fixed → 360px).
  const cell = "clamp(40px, 12.5vw, 60px)";
  return (
    <div style={{ width: cell, height: cell, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--hairline)", position: "relative" }}>
      {bad && <div style={{ position: "absolute", inset: "8%", border: "1.5px solid var(--err)", borderRadius: 10, opacity: 0.75 }} />}
      {v === 0 ? (
        <svg viewBox="0 0 40 40" style={{ width: "56%", height: "56%" }} aria-hidden="true">
          <circle cx="20" cy="20" r="15" style={{ fill: "var(--symbol-a)" }} />
        </svg>
      ) : v === 1 ? (
        <svg viewBox="0 0 40 40" style={{ width: "56%", height: "56%" }} aria-hidden="true">
          <circle cx="20" cy="20" r="13" style={{ fill: "none", stroke: "var(--symbol-b)", strokeWidth: 5 }} />
        </svg>
      ) : null}
    </div>
  );
}

function Beat3Art() {
  const balanced: (0 | 1)[] = [0, 1, 0, 1, 1, 0];
  return (
    <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", border: "1px solid var(--hairline)" }}>
          {balanced.map((v, i) => (
            <StripCell key={i} v={v} />
          ))}
        </div>
        <span style={{ ...monoLabel, color: "var(--symbol-b)" }}>THREE OF EACH</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", border: "1px solid var(--hairline)" }}>
          <StripCell v={0} bad />
          <StripCell v={0} bad />
          <StripCell v={0} bad />
          <StripCell v={1} />
          <StripCell v={null} />
          <StripCell v={null} />
        </div>
        <span style={{ ...monoLabel, color: "var(--err)" }}>THREE ALIKE BREAKS THE RULE</span>
      </div>
    </div>
  );
}

// ─── Beat 4 — hands-on 4×4 ────────────────────────────────────────────────────

function pill(): React.CSSProperties {
  return {
    background: "none",
    border: "1px solid var(--hairline)",
    borderRadius: 999,
    padding: "12px 22px",
    cursor: "pointer",
    color: "inherit",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.16em",
    transition: "border-color .2s, color .2s",
  };
}

function InteractiveBeat({ onFinish }: { onFinish: () => void }) {
  // Seeded so it's deterministic (no SSR/CSR hydration mismatch) and stable across renders.
  const puzzle = useMemo(() => generatePuzzle({ size: 4, difficulty: "easy", seed: "tutorial-v1" }), []);
  const { cells, errors, solved, canUndo, tap, hint, restart } = useGame({
    givens: puzzle.givens,
    solution: puzzle.solution,
    edges: puzzle.edges,
  });

  const placed = cells.reduce((n, row) => n + row.filter((v) => v !== null).length, 0);
  const total = puzzle.size * puzzle.size;
  const status = solved
    ? "Solved."
    : errors.size > 0
    ? "That breaks a rule. Check the marks."
    : "";

  const onPill = (e: React.MouseEvent<HTMLButtonElement>, on: boolean) => {
    e.currentTarget.style.borderColor = on ? "var(--accent)" : "var(--hairline)";
    e.currentTarget.style.color = on ? "var(--accent)" : "inherit";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "clamp(32px,6vw,80px)", flexWrap: "wrap", width: "100%" }}>
      <div style={{ flex: "1 1 300px", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>HOW IT WORKS</div>
        <h1 style={beatTitle}>Try one yourself.</h1>
        <p style={beatBody}>
          A small four-by-four grid: two of each per line, same rules. The plated cells are given. Fill the
          rest. Stuck? Take a hint.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button style={pill()} onClick={hint} disabled={solved} onMouseEnter={(e) => onPill(e, true)} onMouseLeave={(e) => onPill(e, false)}>
            HINT
          </button>
          <button style={pill()} onClick={restart} disabled={!canUndo} onMouseEnter={(e) => onPill(e, true)} onMouseLeave={(e) => onPill(e, false)}>
            RESET
          </button>
          {solved && (
            <button
              onClick={onFinish}
              style={{ background: "var(--accent)", color: "var(--on-accent)", border: "none", borderRadius: 999, padding: "14px 34px", fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "transform .2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              Finish
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: "0 1 380px", width: "100%", minWidth: "min(100%,260px)" }}>
        <Board cells={cells} givens={puzzle.givens} edges={puzzle.edges} errors={errors} onCellTap={tap} readOnly={solved} solved={solved} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 14, minHeight: 22 }}>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, color: solved ? "var(--accent)" : errors.size > 0 ? "var(--err)" : "var(--fg-3)" }}>{status}</span>
          <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", color: "var(--fg-3)", flex: "none" }}>
            {placed} / {total}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Shared beat text styles ──────────────────────────────────────────────────

const beatTitle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "clamp(40px, 6vw, 56px)",
  lineHeight: 1,
  margin: 0,
  letterSpacing: "-0.02em",
};
const beatBody: React.CSSProperties = { margin: 0, fontSize: 16.5, lineHeight: 1.65, color: "var(--fg-3)" };

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TutorialScreen() {
  const router = useRouter();
  const [beat, setBeat] = useState(0);

  const exit = () => router.push("/");

  const BEATS = [
    {
      title: "Two symbols.",
      body: (
        <>
          Every cell takes one of two marks: the amber <b style={{ color: "var(--accent)" }}>disc</b> or the
          teal <b style={{ color: "var(--symbol-b)" }}>ring</b>. Tap a cell to cycle through disc, ring, and empty.
        </>
      ),
      art: <Beat1Art />,
    },
    {
      title: "Read the signs.",
      body: (
        <>
          Some edges carry a sign. <b style={{ color: "var(--fg-1)" }}>=</b> means the two cells match.{" "}
          <b style={{ color: "var(--fg-1)" }}>≠</b> means they differ. Signs are always true.
        </>
      ),
      art: <Beat2Art />,
    },
    {
      title: "The line law.",
      body: (
        <>
          Every row and every column ends with <b style={{ color: "var(--fg-1)" }}>three discs and three
          rings</b>. Three of a kind can never touch.
        </>
      ),
      art: <Beat3Art />,
    },
  ];

  const isInteractive = beat === 3;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={HEADER_BAR}>
        <Wordmark />
        <button
          onClick={exit}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", padding: "4px 0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
        >
          SKIP TUTORIAL
        </button>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1180, width: "100%", margin: "0 auto", padding: "16px clamp(24px, 5vw, 64px) 52px", animation: "fadeup 0.45s var(--ease-editorial) both" }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{ width: 36, height: 2, background: i < beat ? "var(--accent)" : i === beat ? "var(--accent)" : "var(--hairline)", opacity: i < beat ? 0.4 : 1 }}
              />
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--fg-3)" }}>
            BEAT 0{beat + 1} / 04
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {isInteractive ? (
            <InteractiveBeat onFinish={() => router.push("/play")} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(40px,7vw,80px)", flexWrap: "wrap", width: "100%" }}>
              <div style={{ flex: "1 1 300px", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>HOW IT WORKS</div>
                <h1 style={beatTitle}>{BEATS[beat]!.title}</h1>
                <p style={beatBody}>{BEATS[beat]!.body}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                  <button
                    onClick={() => setBeat((b) => b + 1)}
                    style={{ background: "var(--accent)", color: "var(--on-accent)", border: "none", borderRadius: 999, padding: "14px 34px", fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "transform .2s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                  >
                    Next
                  </button>
                  {beat > 0 && (
                    <button
                      onClick={() => setBeat((b) => b - 1)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.18em", padding: "4px 0" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
                    >
                      BACK
                    </button>
                  )}
                </div>
              </div>
              {BEATS[beat]!.art}
            </div>
          )}
        </div>

        {isInteractive && (
          <button
            onClick={() => setBeat(2)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.18em", padding: 0, textAlign: "left", width: "fit-content" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
          >
            BACK
          </button>
        )}
      </div>
    </div>
  );
}
