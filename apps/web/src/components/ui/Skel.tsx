interface SkelProps {
  w?: string | number;
  h?: number;
  r?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export function Skel({
  w = "100%",
  h = 16,
  r = "var(--radius-sm)",
  delay = 0,
  style,
}: SkelProps) {
  return (
    <div
      className="hv-skel"
      style={{
        width: w,
        height: h,
        borderRadius: r,
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    />
  );
}
