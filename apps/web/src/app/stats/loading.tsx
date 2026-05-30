const SKEL: React.CSSProperties = {
  background: "var(--bg-sunken)",
  borderRadius: "var(--radius-md)",
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

export default function StatsLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...SKEL, width: 40, height: 40 }} />
        </div>
        <div style={{ ...SKEL, width: 36, height: 13 }} />
        <div style={{ flex: 1 }} />
      </header>

      <div style={{ flex: 1, padding: "24px 24px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Name */}
        <div style={{ ...SKEL, width: 120, height: 32, borderRadius: "var(--radius-lg)", marginTop: 8 }} />

        {/* Stat tiles row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ ...SKEL, height: 80, borderRadius: "var(--radius-xl)", animationDelay: `${i * 60}ms` }} />
          ))}
        </div>

        {/* Calendar strip */}
        <div>
          <div style={{ ...SKEL, width: 100, height: 11, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ ...SKEL, width: 18, height: 18, borderRadius: 4, flex: 1, animationDelay: `${i * 30}ms` }} />
            ))}
          </div>
        </div>

        {/* Time distribution */}
        <div>
          <div style={{ ...SKEL, width: 120, height: 11, marginBottom: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...SKEL, width: 28, height: 10, flexShrink: 0 }} />
                <div style={{ ...SKEL, height: 8, borderRadius: 999, flex: 1, maxWidth: `${30 + i * 12}%`, animationDelay: `${i * 60}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
