import { Skel } from "@/components/ui/Skel";

export default function StatsLoading() {
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
        <div style={{ flex: 1 }}>
          <Skel w={40} h={40} r="999px" />
        </div>
        <Skel w={72} h={14} />
        <div style={{ flex: 1 }} />
      </header>

      <div
        style={{
          flex: 1,
          padding: "0 24px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Profile row */}
        <div style={{ marginTop: 12 }}>
          <Skel w="42%" h={24} r="var(--radius-sm)" />
          <Skel w={110} h={13} delay={80} style={{ marginTop: 8 }} />
        </div>

        {/* 2×2 stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} h={80} r="var(--radius-xl)" delay={i * 60} />
          ))}
        </div>

        {/* Time distribution */}
        <div>
          <Skel w={140} h={11} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
            {[60, 80, 100, 75, 50, 35].map((pct, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Skel
                  h={Math.round((pct / 100) * 84)}
                  r="5px 5px 0 0"
                  delay={i * 50}
                  style={{ width: "100%", alignSelf: "flex-end" }}
                />
                <Skel w={22} h={10} delay={i * 50} />
              </div>
            ))}
          </div>
        </div>

        {/* Last 14 days */}
        <div>
          <Skel w={88} h={11} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <Skel key={i} h={30} r="5px" delay={i * 25} style={{ flex: 1 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
