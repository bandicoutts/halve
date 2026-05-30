const SKEL: React.CSSProperties = {
  background: "var(--bg-sunken)",
  borderRadius: "var(--radius-md)",
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

function PuzzleRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--hairline)", gap: 12 }}>
      <div style={{ ...SKEL, width: 36, height: 36, borderRadius: "var(--radius-md)", flexShrink: 0, animationDelay: `${delay}ms` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ ...SKEL, width: 80, height: 13, animationDelay: `${delay}ms` }} />
        <div style={{ ...SKEL, width: 52, height: 11, animationDelay: `${delay + 40}ms` }} />
      </div>
    </div>
  );
}

export default function ArchiveLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...SKEL, width: 40, height: 40 }} />
        </div>
        <div style={{ ...SKEL, width: 52, height: 13 }} />
        <div style={{ flex: 1 }} />
      </header>

      <div style={{ flex: 1, padding: "0 24px 40px" }}>
        {/* Today row */}
        <PuzzleRowSkeleton delay={0} />

        {/* Month heading */}
        <div style={{ ...SKEL, width: 80, height: 11, marginTop: 24, marginBottom: 4 }} />

        {/* Past rows */}
        {Array.from({ length: 6 }, (_, i) => (
          <PuzzleRowSkeleton key={i} delay={i * 50} />
        ))}
      </div>
    </div>
  );
}
