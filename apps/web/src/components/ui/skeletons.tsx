import { Wordmark } from "@/components/ui/Wordmark";

// Redesigned loading skeletons — each mirrors the silhouette of its screen so
// content doesn't jump on load. Plain --plate blocks with a staggered breathe.

function Sk({ w, h, r = 6, delay = 0, style }: { w?: number | string; h: number | string; r?: number | string; delay?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "var(--plate)",
        animation: "breathe 1.9s ease-in-out infinite",
        animationDelay: delay ? `${delay}s` : undefined,
        flex: "none",
        ...style,
      }}
    />
  );
}

/** Static header silhouette matching SiteHeader (no auth control while loading). */
function SkHeader() {
  const navItem = (t: string) => (
    <span style={{ color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em" }}>{t}</span>
  );
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "20px clamp(20px,4vw,40px)", flex: "none", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
      <Wordmark href={null} />
      <nav style={{ display: "flex", alignItems: "center", gap: "clamp(14px,2.6vw,22px)" }}>
        {navItem("PRACTICE")}
        {navItem("ARCHIVE")}
        {navItem("STATS")}
        <span style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 200 200" style={{ width: 15, height: 15 }} aria-hidden="true">
            <path d="M95 10 A90 90 0 0 0 95 190 Z" style={{ fill: "var(--fg-1)", opacity: 0.85 }} />
            <circle cx="100" cy="100" r="90" style={{ fill: "none", stroke: "var(--fg-1)", strokeWidth: "10px", opacity: 0.85 }} />
          </svg>
        </span>
      </nav>
    </header>
  );
}

function Shell({ children, srLabel }: { children: React.ReactNode; srLabel: string }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }} role="status" aria-busy="true" aria-label={srLabel}>
      <SkHeader />
      {children}
    </div>
  );
}

const SECTION = (extra?: React.CSSProperties): React.CSSProperties => ({
  flex: 1,
  display: "flex",
  maxWidth: 1200,
  width: "100%",
  margin: "0 auto",
  padding: "8px clamp(20px,4vw,40px) 48px",
  ...extra,
});

export function SkeletonHome() {
  return (
    <Shell srLabel="Loading today’s puzzle">
      <div style={{ ...SECTION({ maxWidth: 1280, alignItems: "stretch", flexWrap: "wrap-reverse", justifyContent: "center" }) }}>
        <div style={{ flex: "1 1 480px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, padding: "40px clamp(0px,4vw,48px) 40px 0", minWidth: 0 }}>
          <Sk w={150} h={11} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Sk w="min(440px,90%)" h={72} r={14} delay={0.12} />
            <Sk w="min(340px,70%)" h={72} r={14} delay={0.24} />
          </div>
          <Sk w="min(360px,80%)" h={14} r={7} delay={0.36} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Sk w={200} h={56} r={999} delay={0.48} />
            <Sk w={90} h={11} delay={0.56} />
            <Sk w={110} h={11} delay={0.64} />
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <Sk key={i} w={11} h={11} r="50%" delay={i * 0.08} />
            ))}
          </div>
        </div>
        <div style={{ flex: "0 0 1px", alignSelf: "stretch", background: "var(--hairline)", margin: "48px 0" }} />
        <div style={{ flex: "1 1 380px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <Sk w="min(300px,60vw)" h="min(300px,60vw)" r="50%" delay={0.3} />
        </div>
      </div>
    </Shell>
  );
}

export function SkeletonPlay() {
  return (
    <Shell srLabel="Loading the puzzle">
      <div style={{ ...SECTION({ alignItems: "center", justifyContent: "center", gap: "clamp(32px,5vw,72px)", flexWrap: "wrap" }) }}>
        <div style={{ flex: "0 1 560px", width: "100%", maxWidth: "min(560px, calc(100dvh - 300px))", minWidth: "min(100%,280px)" }}>
          <div style={{ width: "100%", aspectRatio: 1, border: "1px solid var(--hairline)", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(6,1fr)" }}>
            {Array.from({ length: 36 }, (_, i) => {
              const r = Math.floor(i / 6);
              const c = i % 6;
              return (
                <div key={i} style={{ borderRight: c < 5 ? "1px solid var(--hairline)" : "none", borderBottom: r < 5 ? "1px solid var(--hairline)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "52%", height: "52%", borderRadius: "50%", background: "var(--plate)", animation: "breathe 1.9s ease-in-out infinite", animationDelay: `${(r + c) * 0.06}s` }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <Sk w={160} h={12} />
            <Sk w={90} h={12} delay={0.2} />
          </div>
          <div style={{ height: 2, background: "var(--hairline)", marginTop: 8 }} />
        </div>
        <div style={{ flex: "1 1 260px", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <Sk w={140} h={11} />
          <Sk w={220} h={56} r={12} delay={0.15} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Sk w={100} h={42} r={999} delay={0.3} />
            <Sk w={92} h={42} r={999} delay={0.4} />
            <Sk w={110} h={42} r={999} delay={0.5} />
          </div>
          <Sk w={240} h={14} r={7} delay={0.6} />
        </div>
      </div>
    </Shell>
  );
}

export function SkeletonArchive() {
  return (
    <Shell srLabel="Loading the archive">
      <div style={{ ...SECTION({ maxWidth: 1140, alignItems: "center", justifyContent: "center", gap: "clamp(36px,6vw,88px)", flexWrap: "wrap" }) }}>
        <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <Sk w={180} h={11} />
          <Sk w="min(320px,80%)" h={56} r={12} delay={0.12} />
          <Sk w="min(340px,90%)" h={14} r={7} delay={0.36} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--hairline)", paddingTop: 18 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sk w={12} h={12} r="50%" delay={i * 0.1} />
                <Sk w={120 + i * 20} h={10} r={5} delay={i * 0.1 + 0.05} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 400px", maxWidth: 560, width: "100%", minWidth: "min(100%,320px)", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--hairline)", flex: "none" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Sk w={180} h={26} r={8} />
              <Sk w={120} h={9} r={5} delay={0.15} />
            </div>
            <span style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--hairline)", flex: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 10 }}>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} style={{ aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "78%", height: "78%", borderRadius: "50%", background: "var(--plate)", animation: "breathe 1.9s ease-in-out infinite", animationDelay: `${(i % 7) * 0.05}s` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function SkeletonStats() {
  return (
    <Shell srLabel="Loading your statistics">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 36, maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px clamp(20px,4vw,40px) 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Sk w={190} h={11} />
            <Sk w={260} h={46} r={10} delay={0.15} />
          </div>
          <Sk w={150} h={11} delay={0.3} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ flex: "1 1 300px", padding: "34px 32px 34px 0", display: "flex", alignItems: "center", gap: 26 }}>
            <Sk w={130} h={120} r={14} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Sk w={70} h={10} r={5} delay={0.12} />
              <Sk w={96} h={10} r={5} delay={0.24} />
            </div>
          </div>
          <div style={{ flex: "0 0 1px", background: "var(--hairline)" }} />
          <div style={{ flex: "1 1 320px", padding: "34px 0 34px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 24px", alignContent: "center" }}>
            {[0, 0.15, 0.3, 0.45].map((d, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Sk w={88} h={26} r={8} delay={d} />
                <Sk w={66} h={9} r={5} delay={d + 0.1} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
          <Sk w={170} h={10} r={5} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 8 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} style={{ aspectRatio: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "min(80%,26px)", height: "min(80%,26px)", borderRadius: "50%", background: "var(--plate)", animation: "breathe 1.9s ease-in-out infinite", animationDelay: `${(i % 7) * 0.05}s` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function SkeletonPractice() {
  return (
    <Shell srLabel="Loading practice">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 34, maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px clamp(20px,4vw,40px) 56px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Sk w={200} h={11} />
          <Sk w="min(320px,80%)" h={48} r={12} delay={0.15} />
          <Sk w="min(420px,90%)" h={14} r={7} delay={0.3} />
        </div>
        <div style={{ borderBottom: "1px solid var(--hairline)" }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, padding: "30px 10px", borderTop: "1px solid var(--hairline)", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 170px", display: "flex", flexDirection: "column", gap: 10 }}>
                <Sk w={150} h={32} r={9} delay={d} />
                <Sk w={100} h={9} r={5} delay={d + 0.1} />
              </div>
              <Sk h={14} r={7} delay={d + 0.2} style={{ flex: 1, minWidth: 120 }} />
              <Sk w={70} h={11} delay={d + 0.3} />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Minimal centered skeleton for form screens (auth / onboarding / tutorial). */
export function SkeletonSimple() {
  return (
    <Shell srLabel="Loading">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 24px 48px" }}>
        <Sk w={150} h={11} />
        <Sk w="min(360px,80%)" h={52} r={12} delay={0.12} />
        <Sk w="min(320px,70%)" h={14} r={7} delay={0.24} />
        <Sk w={220} h={52} r={999} delay={0.36} style={{ marginTop: 8 }} />
      </div>
    </Shell>
  );
}
