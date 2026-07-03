"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDisplayName } from "@/app/actions/save-display-name";
import { DISPLAY_NAME_MAX } from "@/lib/display-name";
import { HEADER_BAR, Wordmark } from "@/components/ui/Wordmark";

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
    if (!trimmed) {
      setError("Enter a name, or skip for now.");
      return;
    }
    if (trimmed.length > DISPLAY_NAME_MAX) {
      setError(`Keep it to ${DISPLAY_NAME_MAX} characters or fewer.`);
      return;
    }
    setError(null);
    setLoading(true);
    const result = await saveDisplayName(trimmed);
    setLoading(false);
    if (!result.ok) {
      setError(result.invalid ? "Enter a name (up to 40 characters)." : "Couldn’t save. Try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  function skip() {
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={HEADER_BAR}>
        <Wordmark />
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          padding: "12px clamp(24px, 5vw, 40px) 56px",
          textAlign: "center",
          animation: "fadeup 0.5s var(--ease-editorial) both",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.22em", color: "var(--fg-3)" }}>
          ONE LAST THING
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(38px, 6vw, 56px)",
            lineHeight: 1,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          What should we call you?
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg-3)", maxWidth: "44ch" }}>
          Shown on your stats page.
        </p>

        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            maxLength={DISPLAY_NAME_MAX}
            autoFocus
            autoComplete="name"
            aria-label="Display name"
            aria-invalid={error ? true : undefined}
            readOnly={loading}
            style={{
              width: "100%",
              background: "var(--surface)",
              border: `1px solid ${error ? "var(--err)" : "var(--hairline)"}`,
              borderRadius: 12,
              padding: "16px 18px",
              fontSize: 16,
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              textAlign: "center",
              opacity: loading ? 0.6 : 1,
            }}
          />
          {error ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--err)", flex: "none" }} />
              <span style={{ fontSize: 14, color: "var(--err)" }}>{error}</span>
            </div>
          ) : (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--fg-3)", textAlign: "right" }}>
              {name.length} / {DISPLAY_NAME_MAX}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 6 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "var(--accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: 999,
                padding: "16px 40px",
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.85 : 1,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              {loading && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(27,20,16,.3)",
                    borderTopColor: "#1B1410",
                    animation: "spin .8s linear infinite",
                    display: "inline-block",
                  }}
                />
              )}
              {loading ? "Saving…" : "Save name"}
            </button>
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                cursor: loading ? "default" : "pointer",
                color: "var(--fg-3)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.18em",
                padding: "4px 0",
                opacity: loading ? 0.5 : 1,
                transition: "color 0.18s ease",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
            >
              SKIP FOR NOW
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
