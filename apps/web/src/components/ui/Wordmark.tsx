import Link from "next/link";

/** The split-circle mark + italic "Halve" wordmark, linking home. Used as the
 *  minimal header on auth / onboarding / tutorial / error screens. */
export function Wordmark({ size = 21, href = "/" }: { size?: number; href?: string | null }) {
  const inner = (
    <>
      <svg viewBox="0 0 200 200" style={{ width: size, height: size, flex: "none" }} aria-hidden="true">
        <path d="M95 6 A94 94 0 0 0 95 194 Z" style={{ fill: "var(--accent)" }} />
        <path d="M105 6 A94 94 0 0 1 105 194 Z" style={{ fill: "var(--symbol-b)" }} />
      </svg>
      <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: size + 1, letterSpacing: "-0.01em" }}>
        Halve
      </span>
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg-1)" };
  return href ? (
    <Link href={href} style={style} aria-label="Halve — home">
      {inner}
    </Link>
  ) : (
    <span style={style}>{inner}</span>
  );
}
