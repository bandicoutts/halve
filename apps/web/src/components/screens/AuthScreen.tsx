"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const TEXT_BUTTON: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--fg-3)",
  fontSize: 15,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  padding: "12px 4px",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textAlign: "left",
};

function SentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", padding: "64px 24px 40px", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
        <Logo size={24} />
      </Link>
      <div style={{ marginTop: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-1)", lineHeight: 1.2 }}>
          Check your email.
        </h1>
        <p style={{ marginTop: 14, fontSize: 16, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: 300 }}>
          We sent a link to <strong style={{ color: "var(--fg-1)" }}>{email}</strong>. Click it to sign in — no password needed.
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <button
          onClick={onBack}
          style={TEXT_BUTTON}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          Use a different email
        </button>
        <button
          onClick={() => router.push("/play")}
          style={TEXT_BUTTON}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
        >
          Play now, sign in later
        </button>
      </div>
    </div>
  );
}

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429"))
    return "Too many attempts — wait a minute and try again.";
  if (lower.includes("user already registered"))
    return "An account with this email already exists. Try signing in with a magic link.";
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials"))
    return "Wrong email or password.";
  if (lower.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox.";
  return msg;
}

export function AuthScreen({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Enter your email to continue."); return; }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { setError(friendlyError(error.message)); return; }
    setSent(true);
  }

  if (sent) {
    return <SentScreen email={email} onBack={() => setSent(false)} />;
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", animation: "fade-up 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "64px 24px 40px" }}>

        <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
          <Logo size={24} />
        </Link>

        {error && (
          <p style={{ marginTop: 32, marginBottom: 0, fontSize: 14, color: "var(--wrong)" }}>{error}</p>
        )}

        <form onSubmit={handleMagicLink} style={{ marginTop: error ? 16 : 40, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={INPUT_STYLE}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline)"; }}
            />
          </div>

          <Button variant="primary" full type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Sending…" : "Send me a link"}
          </Button>
        </form>

        <div style={{ flex: 1 }} />

        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <button
            onClick={() => router.push("/play")}
            style={{ background: "none", border: "none", color: "var(--fg-3)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-sans)", padding: "12px 4px" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
          >
            Continue without account
          </button>
        </div>

      </div>
    </div>
  );
}
