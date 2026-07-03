import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

// ── Mutable mock state ──────────────────────────────────────────────────────

let mockExchangeError: { message: string } | null = null;
let mockUser: { id: string } | null = { id: "user-1" };
let mockProfile: { display_name: string | null } | null = { display_name: "Alice" };

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) => void;
      };
    },
  ) => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      exchangeCodeForSession: async () => {
        if (!mockExchangeError) {
          options.cookies.setAll([
            {
              name: "sb-access-token",
              value: "access",
              options: { path: "/", httpOnly: true },
            },
          ]);
        }
        return { error: mockExchangeError };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mockProfile }),
        }),
      }),
    }),
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(search: string) {
  return new NextRequest(`http://localhost/auth/callback${search}`);
}

function redirectedTo(response: Response): string {
  const loc = response.headers.get("location") ?? "";
  const { pathname, search } = new URL(loc);
  return pathname + search;
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockExchangeError = null;
  mockUser = { id: "user-1" };
  mockProfile = { display_name: "Alice" };
});

describe("proxy /auth/callback", () => {
  it("redirects to /auth?error=callback when code param is missing", async () => {
    const response = await proxy(makeRequest(""));
    expect(redirectedTo(response)).toBe("/auth?error=callback");
  });

  it("redirects to /auth?error=callback when code exchange fails", async () => {
    mockExchangeError = { message: "invalid code" };
    const response = await proxy(makeRequest("?code=bad-code"));
    expect(redirectedTo(response)).toBe("/auth?error=callback");
  });

  it("redirects to /onboarding?next=... when user has no display_name", async () => {
    mockProfile = { display_name: null };
    const response = await proxy(makeRequest("?code=abc&next=%2Fplay"));
    expect(redirectedTo(response)).toBe("/onboarding?next=%2Fplay");
  });

  it("safeRedirect falls back to / for an external next URL", async () => {
    const response = await proxy(makeRequest("?code=abc&next=https%3A%2F%2Fevil.com%2Fsteal"));
    expect(redirectedTo(response)).toBe("/");
  });

  it("redirects to the safe next param when code is valid and display_name exists", async () => {
    const response = await proxy(makeRequest("?code=abc&next=%2Fplay"));
    expect(redirectedTo(response)).toBe("/play");
  });

  it("preserves Supabase session cookies on successful callback redirects", async () => {
    const response = await proxy(makeRequest("?code=abc&next=%2Fplay"));
    expect(response.headers.get("set-cookie")).toContain("sb-access-token=access");
  });
});
