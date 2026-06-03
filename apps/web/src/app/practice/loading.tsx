import { Skel } from "@/components/ui/Skel";

export default function PracticeLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <Skel w={40} h={40} r="999px" />
        <div style={{ flex: 1 }} />
        <Skel w={40} h={40} r="999px" delay={80} />
      </header>

      <div style={{ flex: 1, padding: "0 24px 36px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>

          {/* Page title */}
          <Skel w={100} h={13} style={{ marginTop: 8, marginBottom: 32 }} />

          {/* Segmented control */}
          <Skel h={44} r="999px" delay={80} />

          {/* Difficulty detail card */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-xl)",
            padding: "20px 20px 18px",
            marginTop: 20,
          }}>
            <Skel w={88} h={12} delay={120} />
            <Skel w={220} h={14} delay={160} style={{ marginTop: 12 }} />
            <Skel w={180} h={14} delay={200} style={{ marginTop: 8 }} />
            <div style={{ display: "flex", gap: 24, marginTop: 18 }}>
              <Skel w={60} h={11} delay={240} />
              <Skel w={60} h={11} delay={280} />
            </div>
          </div>

          {/* CTA button */}
          <div style={{ marginTop: 28 }}>
            <Skel h={52} r="999px" delay={200} />
          </div>

        </div>
      </div>
    </div>
  );
}
