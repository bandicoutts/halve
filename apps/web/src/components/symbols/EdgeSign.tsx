interface EdgeSignProps {
  sign: "eq" | "ne";
  size?: number;
}

export function EdgeSign({ sign, size = 22 }: EdgeSignProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: "var(--bg)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: size * 0.68,
        color: "var(--fg-1)",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {sign === "eq" ? "=" : "≠"}
    </span>
  );
}
