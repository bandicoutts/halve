"use client";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { GhostLink } from "@/components/ui/GhostLink";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

const RULES: { glyph: string; text: string }[] = [
  { glyph: "3 + 3", text: "Every row and column has three discs and three rings." },
  { glyph: "●●", text: "Never more than two of the same symbol in a row, across or down." },
  { glyph: "=", text: "Cells joined by = hold the same symbol." },
  { glyph: "≠", text: "Cells joined by ≠ hold opposite symbols." },
];

/** How-to-play modal — the prototype's rules sheet, opened from Home and Play. */
export function RulesModal({ open, onClose }: RulesModalProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          color: "var(--fg-1)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-xl)",
          maxWidth: 460,
          width: "100%",
          padding: "clamp(26px, 4vw, 38px)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxHeight: "86dvh",
          overflow: "auto",
          animation: "fadeup 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2
            id="rules-title"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 32,
              margin: 0,
            }}
          >
            How to play
          </h2>
          <GhostLink onClick={onClose}>CLOSE</GhostLink>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {RULES.map((rule) => (
            <div key={rule.glyph} style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  width: 44,
                  flex: "none",
                  color: "var(--accent-text)",
                }}
              >
                {rule.glyph}
              </span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{rule.text}</p>
            </div>
          ))}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--fg-3)",
            borderTop: "1px solid var(--hairline)",
            paddingTop: 18,
          }}
        >
          Tap a cell to cycle empty, disc, ring. Every puzzle can be solved by deduction.
        </p>
      </div>
    </div>
  );
}
