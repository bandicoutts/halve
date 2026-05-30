const SKEL: React.CSSProperties = {
  background: "var(--bg-sunken)",
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

export function BoardSkeleton() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...SKEL, width: 40, height: 40, borderRadius: "var(--radius-md)" }} />
        </div>
        <div style={{ ...SKEL, width: 52, height: 12, borderRadius: "var(--radius-sm)" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ ...SKEL, width: 60, height: 32, borderRadius: 999 }} />
        </div>
      </header>

      {/* Timer — static 0:00 reads as a real starting state */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
          0:00
        </div>
      </div>

      {/* Board — 6×6 skeleton grid */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7, width: "min(calc(100vw - 48px), calc(55dvh - 80px))" }}>
          {Array.from({ length: 36 }, (_, i) => (
            <div key={i} style={{ ...SKEL, aspectRatio: "1", borderRadius: "var(--radius-cell)", animationDelay: `${(i % 6) * 40}ms` }} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36, padding: "8px 24px 16px" }}>
        {["Undo", "Hint"].map((label) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ ...SKEL, width: 48, height: 48, borderRadius: "var(--radius-md)" }} />
            <div style={{ ...SKEL, width: 28, height: 10, borderRadius: "var(--radius-sm)" }} />
          </div>
        ))}
      </div>

      {/* "How to play" link area — matches minHeight: 44 + paddingBottom: 32 */}
      <div style={{ height: 76 }} />
    </div>
  );
}
