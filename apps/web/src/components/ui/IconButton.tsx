"use client";

interface IconButtonProps {
  label: string;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  size?: number | undefined;
  children: React.ReactNode;
}

export function IconButton({ label, onClick, disabled, size = 48, children }: IconButtonProps) {
  // Floor the hit area at 44px (touch-target minimum) regardless of caller size.
  const dim = Math.max(size, 44);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: dim,
        height: dim,
        borderRadius: "var(--radius-full)",
        border: "1.5px solid var(--hairline-2)",
        background: "transparent",
        color: "var(--fg-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.16s, color 0.16s, transform 0.12s, border-color 0.16s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const el = e.currentTarget;
          el.style.color = "var(--fg-1)";
          el.style.background = "var(--surface)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.color = "var(--fg-2)";
        el.style.background = "transparent";
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.94)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onTouchStart={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.91)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onTouchCancel={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}
