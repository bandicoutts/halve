import { Skel } from "@/components/ui/Skel";

export default function AuthLoading() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      {/* Logo top-left */}
      <div
        style={{
          flexShrink: 0,
          padding: "22px 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Skel w={26} h={26} r="999px" />
        <Skel w={52} h={15} />
      </div>

      {/* Centered form area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340 }}>
          <Skel w="58%" h={30} r="var(--radius-md)" />
          <Skel w="90%" h={13} delay={100} style={{ marginTop: 14 }} />
          <Skel w="68%" h={13} delay={160} style={{ marginTop: 7 }} />
          <Skel w={52} h={11} delay={220} style={{ marginTop: 24 }} />
          <Skel h={50} r="var(--radius-md)" delay={280} style={{ marginTop: 8 }} />
          <Skel h={52} r="999px" delay={340} style={{ marginTop: 16 }} />
        </div>
      </div>

      {/* Footer ghost link */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 24px 30px",
        }}
      >
        <Skel w={160} h={13} delay={400} />
      </div>
    </div>
  );
}
