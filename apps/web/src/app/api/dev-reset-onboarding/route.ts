import { NextResponse, type NextRequest } from "next/server";

/**
 * DEV-ONLY test helper: clears the dev test account's `display_name` so the
 * E2E suite can exercise the onboarding page's own gate (OnboardingScreen
 * shown when unnamed; redirect away once named) against a real DB row,
 * without needing a full magic-link browser flow for a throwaway user.
 *
 * Same defence-in-depth as /api/dev-login (see that file's header comment)
 * — NODE_ENV, localhost-only, and a matching ?secret, or this 404s. Only ever
 * touches DEV_TEST_EMAIL's own profile row.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }
  const host = (request.headers.get("host") ?? "").split(":")[0]!;
  if (!LOCAL_HOSTS.has(host)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const expected = process.env.DEV_LOGIN_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.DEV_TEST_EMAIL;
  if (!url || !serviceKey || !testEmail) {
    return new NextResponse("Missing Supabase env vars", { status: 500 });
  }

  // Resolve DEV_TEST_EMAIL -> user id the same way dev-login does (profiles
  // has no email column to look up directly; generate_link's response embeds
  // the full user record even though we discard the link itself here).
  const genRes = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "magiclink", email: testEmail }),
  });
  const gen = await genRes.json();
  const userId: string | undefined = gen?.id ?? gen?.user?.id;
  if (!genRes.ok || !userId) {
    return new NextResponse(
      `generate_link failed (${genRes.status}): ${gen?.msg ?? gen?.error ?? "no user id (does the test user exist?)"}`,
      { status: 500 },
    );
  }

  const patchRes = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ display_name: null }),
  });
  if (!patchRes.ok) {
    return new NextResponse(`profiles reset failed (${patchRes.status}): ${await patchRes.text()}`, {
      status: 500,
    });
  }

  return NextResponse.json({ ok: true });
}
