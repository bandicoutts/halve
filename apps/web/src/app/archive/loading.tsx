import { Skel } from "@/components/ui/Skel";
import { FitToViewport } from "@/components/ui/FitToViewport";

// Mirror ArchiveScreen's layout constants so the skeleton matches the real grid.
const CELL_H = 42;
const CONTENT_MAX = 460;

export default function ArchiveLoading() {
  return (
    <div
      style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}
    >
      {/* TopBar — back button left, centered title, theme toggle right */}
      <header
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <Skel w={40} h={40} r="999px" />
        </div>
        <Skel w={60} h={15} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {/* ThemeToggle pill — 60×32 */}
          <Skel w={60} h={32} r="999px" delay={120} />
        </div>
      </header>

      {/* Fit-to-viewport area — content capped + centered to match the real screen */}
      <FitToViewport style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: CONTENT_MAX, width: "100%", paddingTop: 14, paddingBottom: 40 }}>
          {/* Month navigation — arrow · month picker · arrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Skel w={40} h={40} r="999px" />
            <Skel w={150} h={24} r="var(--radius-md)" delay={80} />
            <Skel w={40} h={40} r="999px" delay={160} />
          </div>

          {/* Month summary strip (solved · avg · best) */}
          <div style={{ marginTop: 6, marginBottom: 18, display: "flex", justifyContent: "center" }}>
            <Skel w={210} h={14} delay={100} />
          </div>

          {/* Day-of-week header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {Array.from({ length: 7 }, (_, i) => (
              <Skel key={i} w="55%" h={10} delay={i * 20} style={{ margin: "0 auto" }} />
            ))}
          </div>

          {/* Calendar grid — fixed-height cells (not square) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {Array.from({ length: 35 }, (_, i) => (
              <Skel
                key={i}
                h={CELL_H}
                delay={(i % 7) * 30 + Math.floor(i / 7) * 20}
              />
            ))}
          </div>

          {/* Footer hint */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <Skel w={130} h={12} delay={120} />
          </div>

          {/* Legend */}
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <Skel w={260} h={14} delay={180} />
          </div>
        </div>
      </FitToViewport>
    </div>
  );
}
