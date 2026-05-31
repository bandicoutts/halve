/** Circular initial avatar — the app's account glyph. Used on the Stats
 *  identity row and as the account entry point in the home TopBar. */
export function Monogram({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        background: "var(--accent-tint)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
      }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
