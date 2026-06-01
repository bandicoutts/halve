import { Eyebrow } from "@/components/ui/Eyebrow";

interface StatTileProps {
  value: string;
  label: string;
  accent?: boolean;
}

export function StatTile({ value, label, accent }: StatTileProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        className="tnum"
        style={{
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1,
          color: accent ? "var(--accent)" : "var(--fg-1)",
        }}
      >
        {value}
      </div>
      <Eyebrow style={{ marginTop: 8 }}>{label}</Eyebrow>
    </div>
  );
}
