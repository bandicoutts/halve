import { Skel } from "@/components/ui/Skel";

export default function TutorialLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <Skel w={40} h={40} r="999px" />
        <div style={{ flex: 1 }} />
      </header>

      <div style={{ flex: 1, padding: "0 24px 36px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>

          {/* Step label + heading */}
          <Skel w={72} h={12} style={{ marginTop: 8, marginBottom: 12 }} />
          <Skel w={200} h={26} delay={80} />
          <Skel w={260} h={14} delay={120} style={{ marginTop: 12 }} />
          <Skel w={220} h={14} delay={140} style={{ marginTop: 8 }} />

          {/* Demo board area */}
          <div style={{
            marginTop: 28,
            aspectRatio: "1",
            maxWidth: 320,
            width: "100%",
            margin: "28px auto 0",
          }}>
            <Skel h={0} r="var(--radius-lg)" delay={160} style={{ paddingBottom: "100%" }} />
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <Skel h={48} r="999px" delay={200} style={{ flex: 1 }} />
            <Skel h={48} r="999px" delay={240} style={{ flex: 2 }} />
          </div>

        </div>
      </div>
    </div>
  );
}
