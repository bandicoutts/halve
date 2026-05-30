"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/symbols/Logo";
import { Button } from "@/components/ui/Button";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--hairline)",
  background: "var(--surface)",
  color: "var(--fg-1)",
  fontSize: 16,
  padding: "0 14px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--fg-2)",
  marginBottom: 6,
};

interface OnboardingScreenProps {
  next: string;
}

export function OnboardingScreen({ next }: OnboardingScreenProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter a name, or skip."); return; }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id);
    setLoading(false);
    if (updateError) { setError("Couldn't save — try again."); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", padding: "64px 24px 40px", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <Logo size={24} />

      <div style={{ marginTop: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.2 }}>
          What should we call you?
        </h1>
        <p style={{ marginTop: 14, fontSize: 16, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: 300 }}>
          Shown on your stats page.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={LABEL_STYLE}>Display name</label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={INPUT_STYLE}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
          />
        </div>

        {error && <p style={{ fontSize: 14, color: "var(--wrong)", margin: 0 }}>{error}</p>}

        <Button variant="primary" full type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Saving…" : "Save name"}
        </Button>
      </form>

      <div style={{ flex: 1 }} />

      <div style={{ textAlign: "center", paddingBottom: 8 }}>
        <button
          onClick={() => { router.push(next); }}
          style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", padding: "0 8px", height: 44, display: "flex", alignItems: "center" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
