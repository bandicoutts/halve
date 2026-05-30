import { Skel } from "@/components/ui/Skel";

export default function HomeLoading() {
  return (
    <div
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}
    >
      {/* TopBar */}
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
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <Skel w={26} h={26} r="999px" />
          <Skel w={52} h={15} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skel w={40} h={24} r="999px" delay={60} />
          <Skel w={60} h={32} r="999px" delay={120} />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 40px" }}>
        {/* Streak/user content slot — fixed 24px */}
        <div style={{ marginTop: 32, height: 24 }} />

        {/* Meta row + heading */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <Skel w={84} h={12} />
            <Skel w={52} h={12} delay={80} />
            <Skel w={36} h={12} delay={160} />
          </div>
          <Skel w="62%" h={44} r="var(--radius-md)" delay={120} />
        </div>

        {/* CTA button */}
        <div style={{ marginTop: 24 }}>
          <Skel h={52} r="999px" delay={240} />
        </div>

        {/* Nav links */}
        <div style={{ marginTop: 40, borderTop: "1px solid var(--hairline)" }}>
          <div style={{ borderBottom: "1px solid var(--hairline)", padding: "16px 0" }}>
            <Skel w={72} h={17} delay={300} />
          </div>
          <div style={{ padding: "16px 0" }}>
            <Skel w={64} h={17} delay={360} />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <Skel w={72} h={13} delay={420} />
          <Skel w={44} h={13} delay={480} />
        </div>
      </div>
    </div>
  );
}
