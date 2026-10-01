import Link from "next/link";
import { Mark } from "@/components/symbols/Mark";

/**
 * Shared header bar — the SAME width + padding on every screen so the wordmark
 * sits in an identical spot app-wide (a single standard app-chrome width, even
 * when the page content below is narrower). Spread extra props after it.
 */
export const HEADER_BAR: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  padding: "20px clamp(20px, 4vw, 40px)",
  maxWidth: 1280,
  margin: "0 auto",
  width: "100%",
  flex: "none",
};

/** The split-ring mark + italic "Halve" wordmark, linking home. Used as the
 *  minimal header on auth / onboarding / tutorial / error screens. */
export function Wordmark({ size = 21, href = "/" }: { size?: number; href?: string | null }) {
  const inner = (
    <>
      <Mark size={size} decorative style={{ flex: "none" }} />
      <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500, fontSize: size + 1, letterSpacing: "-0.01em" }}>
        Halve
      </span>
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg-1)" };
  return href ? (
    <Link href={href} style={style} aria-label="Halve home">
      {inner}
    </Link>
  ) : (
    <span style={style}>{inner}</span>
  );
}
