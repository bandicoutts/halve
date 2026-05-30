const SKEL: React.CSSProperties = {
  background: "var(--bg-sunken)",
  borderRadius: "var(--radius-md)",
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...SKEL, width: 72, height: 20 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ ...SKEL, width: 40, height: 40, borderRadius: "var(--radius-md)" }} />
          <div style={{ ...SKEL, width: 60, height: 32, borderRadius: 999 }} />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 40px" }}>
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ ...SKEL, width: 80, height: 12 }} />
            <div style={{ ...SKEL, width: 50, height: 12 }} />
          </div>
          <div style={{ ...SKEL, width: "65%", height: 44, borderRadius: "var(--radius-lg)", marginBottom: 8 }} />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ ...SKEL, width: "100%", height: 52, borderRadius: 999 }} />
        </div>

        <div style={{ marginTop: 40, borderTop: "1px solid var(--hairline)" }}>
          <div style={{ borderBottom: "1px solid var(--hairline)", padding: "16px 0" }}>
            <div style={{ ...SKEL, width: 72, height: 17 }} />
          </div>
          <div style={{ padding: "16px 0" }}>
            <div style={{ ...SKEL, width: 64, height: 17 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
