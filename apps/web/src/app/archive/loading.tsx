import { Skel } from "@/components/ui/Skel";

export default function ArchiveLoading() {
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
        <Skel w={60} h={15} />
        <div style={{ flex: 1 }} />
      </header>

      {/* Pinned detail card + legend */}
      <div style={{ flexShrink: 0, padding: "6px 24px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 18px",
            marginBottom: 14,
          }}
        >
          <Skel w={40} h={40} r="999px" />
          <div style={{ flex: 1 }}>
            <Skel w={130} h={15} />
            <Skel w={80} h={11} delay={120} style={{ marginTop: 8 }} />
          </div>
          <Skel w={52} h={22} delay={220} />
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Skel w={60} h={12} />
          <Skel w={76} h={12} delay={80} />
          <Skel w={52} h={12} delay={160} />
        </div>
      </div>

      <div style={{ height: 1, background: "var(--hairline)", flexShrink: 0 }} />

      {/* Month nav + calendar */}
      <div style={{ flex: 1, padding: "18px 24px 40px" }}>
        {/* Month navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <Skel w={40} h={40} r="999px" />
          <Skel w={140} h={24} r="var(--radius-md)" delay={80} />
          <Skel w={40} h={40} r="999px" delay={160} />
        </div>
        <Skel w={80} h={12} delay={100} style={{ margin: "0 auto 18px", display: "block" }} />

        {/* Day-of-week header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 6,
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <Skel key={i} w="60%" h={10} delay={i * 20} style={{ margin: "0 auto" }} />
          ))}
        </div>

        {/* Calendar grid — 5 rows */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {Array.from({ length: 35 }, (_, i) => (
            <Skel
              key={i}
              h={0}
              r="var(--radius-sm)"
              delay={(i % 7) * 30 + Math.floor(i / 7) * 20}
              style={{ aspectRatio: "1", height: "auto" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
