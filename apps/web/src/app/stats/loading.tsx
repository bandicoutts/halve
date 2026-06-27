import { Skel } from "@/components/ui/Skel";
import { FitToViewport } from "@/components/ui/FitToViewport";

export default function StatsLoading() {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* TopBar */}
      <header style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Skel w={40} h={40} r="999px" />
        </div>
        <Skel w={72} h={14} />
        <div style={{ flex: 1 }} />
      </header>

      <FitToViewport style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 560, width: "100%", paddingBottom: 36 }}>

          {/* Identity row — monogram + name + subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, marginBottom: 24 }}>
            <Skel w={48} h={48} r="999px" />
            <div>
              <Skel w={120} h={20} />
              <Skel w={168} h={12} delay={140} style={{ marginTop: 8 }} />
            </div>
          </div>

          {/* Streak hero card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-xl)", padding: "22px 22px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <Skel w={92} h={12} />
              <Skel w={96} h={48} r="var(--radius-md)" delay={140} style={{ marginTop: 12 }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <Skel w={40} h={22} delay={220} style={{ marginLeft: "auto" }} />
              <Skel w={56} h={11} delay={300} style={{ marginTop: 8, marginLeft: "auto" }} />
            </div>
          </div>

          {/* Last 14 days — two labeled rows */}
          <div style={{ marginTop: 28 }}>
            <Skel w={88} h={12} style={{ marginBottom: 14 }} />
            {[0, 1].map((r) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <Skel w={76} h={11} />
                <div style={{ display: "flex", gap: 6, flex: 1 }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skel key={i} h={0} delay={r * 120 + i * 40} style={{ flex: 1, aspectRatio: "1", height: "auto" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Solve time area chart */}
          <div style={{ marginTop: 28 }}>
            <Skel w={84} h={12} style={{ marginBottom: 14 }} />
            <Skel h={132} r="var(--radius-md)" delay={120} />
          </div>

          {/* Avg + best time divided row */}
          <div style={{ marginTop: 24 }}>
            <Skel h={76} r="var(--radius-lg)" delay={160} />
          </div>

          {/* Sign out — pill button (paddingTop: 32, height: 44) */}
          <div style={{ paddingTop: 32, display: "flex", justifyContent: "center" }}>
            <Skel w={130} h={44} r="999px" delay={220} />
          </div>

        </div>
      </FitToViewport>
    </div>
  );
}
