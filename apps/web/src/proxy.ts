import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

const SAFE_REDIRECT_PATHS = ["/", "/play", "/practice", "/stats"];

function safeRedirect(next: string | null): string {
  if (!next) return "/";
  try {
    const url = new URL(next, "http://localhost");
    if (SAFE_REDIRECT_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
      return url.pathname + url.search;
    }
  } catch {
    /* ignore malformed */
  }
  return "/";
}

export async function proxy(request: NextRequest) {
  /* No-op until Supabase env vars are configured */
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* Refresh session — keeps cookies fresh */
  await supabase.auth.getUser();

  /* Handle /auth/callback (magic link / OAuth redirect) */
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/auth/callback") {
    const code = searchParams.get("code");
    const next = safeRedirect(searchParams.get("next"));
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
    }
    return NextResponse.redirect(new URL("/auth?error=callback", request.url));
  }

  return response;
}
