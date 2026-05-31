import { Skel } from "@/components/ui/Skel";

export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar — logo left, sign-in pill + theme toggle right */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <Skel w={26} h={26} r="999px" />
          <Skel w={52} h={15} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skel w={62} h={34} r="999px" delay={60} />
          <Skel w={60} h={32} r="999px" delay={120} />
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 28px" }}>
       {/* Content is capped + centered to match HomeScreen (HOME_MAX = 480) */}
       <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Hero — meta row + heading + CTA */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "center" }}>
            <Skel w={92} h={12} />
            <Skel w={56} h={12} delay={80} />
            <Skel w={40} h={12} delay={160} />
          </div>
          <Skel w="68%" h={44} r="var(--radius-md)" delay={120} />
          <div style={{ marginTop: 22 }}>
            <Skel h={52} r="999px" delay={240} />
          </div>
        </div>

        {/* Destination cards */}
        <div style={{ marginTop: 36 }}>
          <Skel w={108} h={12} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 12 }}>
            <Skel h={132} r="var(--radius-xl)" delay={120} style={{ flex: 1 }} />
            <Skel h={132} r="var(--radius-xl)" delay={260} style={{ flex: 1 }} />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />

        {/* Footer — "How to play" only */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
          <Skel w={80} h={13} delay={360} />
        </div>
       </div>
      </div>
    </div>
  );
}
