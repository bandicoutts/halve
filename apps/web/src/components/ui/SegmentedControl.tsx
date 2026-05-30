"use client";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--bg-sunken)",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 999,
              border: "none",
              background: active ? "var(--surface-raised)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              letterSpacing: "-0.01em",
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
