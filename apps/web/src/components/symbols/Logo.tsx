import { Mark } from "./Mark";

interface LogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export function Logo({ size = 26, style }: LogoProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.32,
        ...style,
      }}
    >
      <Mark size={size * 1.8} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: size,
          letterSpacing: "-0.025em",
          color: "var(--fg-1)",
        }}
      >
        Parity
      </span>
    </span>
  );
}
