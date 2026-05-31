import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * DEV-ONLY login helper for automated verification of authenticated screens.
 *
 * Navigating to `/api/dev-login` mints a session for a single hard-coded test
 * account and sets the auth cookies, then redirects home — no password is ever
 * typed and no email is sent. Flow:
 *   1. Admin `generate_link` returns a one-time magic-link OTP hash directly.
 *   2. The public `/verify` endpoint exchanges that hash for a session
 *      (access + refresh tokens) — this is the non-PKCE path, so no
 *      client-side code verifier is needed.
 *   3. `setSession` on a cookie-writing server client persists the session.
 *
 * Safety:
 *  - Returns 404 unless NODE_ENV === "development" (so it never ships in a
 *    Vercel/production build — there NODE_ENV === "production").
 *  - Only ever authenticates as TEST_EMAIL; it cannot impersonate other users.
 *  - The test account must already exist; `generate_link` errors otherwise.
 */

const TEST_EMAIL = "stayrightdemo@gmail.com";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return new NextResponse("Missing Supabase env vars", { status: 500 });
  }

  // 1. Admin: generate a magic-link OTP hash for the test user (no email sent).
  const genRes = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email: TEST_EMAIL }),
  });
  const gen = await genRes.json();
  if (!genRes.ok || !gen?.hashed_token) {
    return new NextResponse(
      `generate_link failed (${genRes.status}): ${gen?.msg ?? gen?.error ?? "no token (does the test user exist?)"}`,
      { status: 500 },
    );
  }

  // 2. Exchange the OTP hash for a session via the public verify endpoint.
  const verifyRes = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: gen.verification_type ?? "magiclink",
      token_hash: gen.hashed_token,
    }),
  });
  const session = await verifyRes.json();
  if (!verifyRes.ok || !session?.access_token || !session?.refresh_token) {
    return new NextResponse(
      `verify failed (${verifyRes.status}): ${session?.msg ?? session?.error_description ?? "no session"}`,
      { status: 500 },
    );
  }

  // 3. Persist the session as cookies on a redirect response.
  let response = NextResponse.redirect(new URL("/", request.url));
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { error: setErr } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (setErr) {
    return new NextResponse(`setSession failed: ${setErr.message}`, {
      status: 500,
    });
  }

  return response;
}
