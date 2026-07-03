import { vi, describe, it, expect, beforeEach } from "vitest";
import { saveDisplayName } from "./save-display-name";
import { DISPLAY_NAME_MAX } from "@/lib/display-name";

// ── Mutable mock state ──────────────────────────────────────────────────────

let mockUser: { id: string } | null = { id: "user-1" };
let mockUpdateError: { message: string } | null = null;
let capturedUpsertArgs: unknown[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
    from: () => ({
      upsert: (...args: unknown[]) => {
        capturedUpsertArgs = args;
        return Promise.resolve({ error: mockUpdateError });
      },
    }),
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUser = { id: "user-1" };
  mockUpdateError = null;
  capturedUpsertArgs = [];
});

describe("saveDisplayName", () => {
  it("returns ok:false when user is unauthenticated", async () => {
    mockUser = null;
    expect(await saveDisplayName("Alice")).toEqual({ ok: false });
  });

  it("returns ok:false with invalid:true when input is not a string", async () => {
    expect(await saveDisplayName(123 as unknown as string)).toEqual({ ok: false, invalid: true });
  });

  it("returns ok:false with invalid:true for an empty string", async () => {
    expect(await saveDisplayName("")).toEqual({ ok: false, invalid: true });
  });

  it("returns ok:false with invalid:true for a whitespace-only string", async () => {
    expect(await saveDisplayName("   ")).toEqual({ ok: false, invalid: true });
  });

  it("returns ok:false with invalid:true when name exceeds DISPLAY_NAME_MAX", async () => {
    const tooLong = "a".repeat(DISPLAY_NAME_MAX + 1);
    expect(await saveDisplayName(tooLong)).toEqual({ ok: false, invalid: true });
  });

  it("returns ok:true for a valid name", async () => {
    expect(await saveDisplayName("Alice")).toEqual({ ok: true });
  });

  it("returns ok:false on a DB error", async () => {
    mockUpdateError = { message: "connection reset" };
    expect(await saveDisplayName("Alice")).toEqual({ ok: false });
  });

  it("upserts the authenticated user's profile row — not a hardcoded id", async () => {
    mockUser = { id: "user-abc-123" };
    await saveDisplayName("Alice");
    expect(capturedUpsertArgs).toEqual([
      { id: "user-abc-123", display_name: "Alice" },
      { onConflict: "id" },
    ]);
  });
});
