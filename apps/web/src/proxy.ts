import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSafePath } from "@/lib/safe-paths";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

function safeRedirect(next: string | null): string {
  if (!next) return "/";
  try {
    const url = new URL(next, "http://localhost");
    if (isSafePath(url.pathname)) return url.pathname + url.search;
  } catch {
    /* ignore malformed */
  }
  return "/";
}

function redirectPreservingCookies(
  request: NextRequest,
  responseWithCookies: NextResponse,
  path: string,
) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  for (const cookie of responseWithCookies.cookies.getAll()) {
    const { name, value, ...options } = cookie;
    redirect.cookies.set(name, value, options);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  /* Handle /auth/callback (magic link / OAuth redirect) */
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/auth/callback") {
    const code = searchParams.get("code");
    const next = safeRedirect(searchParams.get("next"));
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle();
          if (!profile?.display_name) {
            // Strip query string: only carry the pathname into ?next= to
            // prevent a nested ?next= value from bypassing safe-path checks.
            const nextPathname = new URL(next, "http://localhost").pathname;
            return redirectPreservingCookies(
              request,
              response,
              `/onboarding?next=${encodeURIComponent(nextPathname)}`
            );
          }
        }
        return redirectPreservingCookies(request, response, next);
      }
    }
    return redirectPreservingCookies(request, response, "/auth?error=callback");
  }

  return response;
}
