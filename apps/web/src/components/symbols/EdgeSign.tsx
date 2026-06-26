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
        borderRadius: "var(--radius-full)",
        background: "var(--bg)",
        // Hairline border defines the bg-filled capsule against the same-coloured
        // grid gap it sits on, so the constraint reads clearly (it's a core rule).
        border: "1px solid var(--hairline-2)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: size * 0.74,
        color: "var(--fg-1)",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {sign === "eq" ? "=" : "≠"}
    </span>
  );
}
