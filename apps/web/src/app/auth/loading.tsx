const SKEL: React.CSSProperties = {
  background: "var(--bg-sunken)",
  borderRadius: "var(--radius-md)",
  animation: "skeleton-pulse 1.8s ease-in-out infinite",
};

export default function AuthLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", padding: "64px 24px 40px" }}>
      {/* Logo */}
      <div style={{ ...SKEL, width: 96, height: 24, borderRadius: "var(--radius-sm)" }} />

      {/* Title */}
      <div style={{ marginTop: 48 }}>
        <div style={{ ...SKEL, width: "55%", height: 32, borderRadius: "var(--radius-md)" }} />
        <div style={{ ...SKEL, width: "80%", height: 14, borderRadius: "var(--radius-sm)", marginTop: 16 }} />
        <div style={{ ...SKEL, width: "60%", height: 14, borderRadius: "var(--radius-sm)", marginTop: 8 }} />
      </div>

      {/* Form */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...SKEL, width: 44, height: 13, borderRadius: "var(--radius-sm)" }} />
        <div style={{ ...SKEL, width: "100%", height: 50, borderRadius: "var(--radius-md)" }} />
        <div style={{ ...SKEL, width: "100%", height: 52, borderRadius: 999, marginTop: 4 }} />
      </div>
    </div>
  );
}
