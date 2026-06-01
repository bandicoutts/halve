"use client";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}

export function SegmentedControl({ options, value, onChange, label }: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "flex",
        background: "var(--bg-sunken)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-full)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            aria-pressed={active}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: "var(--radius-full)",
              border: "none",
              background: active ? "var(--surface-raised)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
              fontSize: "var(--text-small)",
              fontWeight: active ? 600 : 400,
              letterSpacing: "var(--tracking-snug)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.15s",
              padding: "0 16px",
            }}
            onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
            onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
