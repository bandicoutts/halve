"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/symbols/Logo";
import { Mark } from "@/components/symbols/Mark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GhostLink } from "@/components/ui/GhostLink";

// ─── Shell (Logo top-left, form vertically centered, footer anchored) ─────────

function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div style={{ flexShrink: 0, padding: "22px 24px 0" }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none" }}>
          <Logo size={20} />
        </Link>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340 }}>{children}</div>
      </div>
      {footer && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "0 24px 26px",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Callout — wrong-tint pill for the expired-link error ────────────────────

function CalloutError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "var(--wrong-tint)",
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        marginBottom: 22,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "var(--radius-full)",
          background: "var(--wrong)",
          color: "var(--surface)",
          flexShrink: 0,
          marginTop: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--text-label)",
          fontWeight: 700,
        }}
      >
        !
      </span>
      <span style={{ fontSize: "var(--text-small)", lineHeight: 1.45, color: "var(--wrong)" }}>
        {children}
      </span>
    </div>
  );
}

// ─── Sent screen ─────────────────────────────────────────────────────────────

function SentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  return (
    <AuthShell
      footer={
        <>
          <GhostLink onClick={onBack}>Use a different email</GhostLink>
          <GhostLink onClick={() => router.push("/play")}>
            Play now, sign in later
          </GhostLink>
        </>
      }
    >
      <div
        style={{
          display: "flex",
          marginBottom: 22,
          animation: "win-mark .6s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <Mark size={40} />
      </div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          color: "var(--fg-1)",
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        Check your email.
      </h1>
      <p
        style={{
          fontSize: "var(--text-small)",
          lineHeight: 1.55,
          color: "var(--fg-2)",
          margin: "12px 0 0",
        }}
      >
        We sent a link to{" "}
        <strong style={{ color: "var(--fg-1)", fontWeight: 600 }}>{email}</strong>.
        Click it to sign in — no password needed.
      </p>
    </AuthShell>
  );
}

// ─── Error normalisation ─────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function AuthScreen({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Enter your email to continue.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: supaError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (supaError) {
      setError(friendlyError(supaError.message));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <SentScreen email={email} onBack={() => setSent(false)} />;
  }

  return (
    <AuthShell
      footer={
        <GhostLink onClick={() => router.push("/play")}>
          Continue without account
        </GhostLink>
      }
    >
      {/* Wrong-tint callout for the expired-link error case */}
      {initialError && <CalloutError>{initialError}</CalloutError>}

      <h1
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          color: "var(--fg-1)",
          margin: 0,
          lineHeight: 1.05,
        }}
      >
        Sign in
      </h1>
      <p
        style={{
          fontSize: "var(--text-small)",
          lineHeight: 1.5,
          color: "var(--fg-2)",
          margin: "10px 0 24px",
        }}
      >
        Enter your email and we&rsquo;ll send a one-time link — no password to
        remember.
      </p>

      <form
        onSubmit={handleMagicLink}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus={!initialError}
          required
          autoComplete="email"
        />
        <Button variant="primary" full type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send me a link"}
        </Button>
      </form>
    </AuthShell>
  );
}
