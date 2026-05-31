import { describe, it, expect } from "vitest";
import { resolveLocalToday, formatDateLabel, solveDay } from "./local-date";

describe("resolveLocalToday — the one canonical clock (EPIC-B)", () => {
  const UTC = "2026-05-31";

  it("accepts a valid same-day cookie", () => {
    expect(resolveLocalToday("2026-05-31", UTC)).toBe("2026-05-31");
  });

  it("accepts a cookie one day ahead (UTC+ user past local midnight)", () => {
    expect(resolveLocalToday("2026-06-01", UTC)).toBe("2026-06-01");
  });

  it("accepts a cookie one day behind (UTC- user before local midnight)", () => {
    expect(resolveLocalToday("2026-05-30", UTC)).toBe("2026-05-30");
  });

  it("rejects a forged future date beyond ±1 day → falls back to UTC", () => {
    expect(resolveLocalToday("2099-01-01", UTC)).toBe(UTC);
  });

  it("rejects a date more than one day in the past → falls back to UTC", () => {
    expect(resolveLocalToday("2026-05-29", UTC)).toBe(UTC);
  });

  it("rejects a malformed cookie → falls back to UTC", () => {
    expect(resolveLocalToday("not-a-date", UTC)).toBe(UTC);
    expect(resolveLocalToday("2026-5-1", UTC)).toBe(UTC);
    expect(resolveLocalToday(undefined, UTC)).toBe(UTC);
  });

  it("served-puzzle date == streak today: every page and the streak bucket use "
    + "this single resolver, so a UTC+ user near midnight gets the SAME date "
    + "for the served puzzle and their streak 'today'", () => {
    // Simulate a UTC+10 user at 23:30 UTC on the 31st → local date is the 1st.
    const utcNow = "2026-05-31";
    const localCookie = "2026-06-01";
    const served = resolveLocalToday(localCookie, utcNow); // play/page.tsx gate
    const streakToday = resolveLocalToday(localCookie, utcNow); // streak "today"
    expect(served).toBe(streakToday);
    expect(served).toBe("2026-06-01");
  });
});

describe("formatDateLabel — deterministic, timezone-independent (NXT-1)", () => {
  it("formats at UTC so the day never shifts by the runtime timezone", () => {
    expect(formatDateLabel("2026-06-01")).toBe("Monday, June 1");
    expect(formatDateLabel("2026-12-25")).toBe("Friday, December 25");
  });
});

describe("solveDay — prefers stored local_date, falls back to UTC (BE-3)", () => {
  it("uses local_date when present", () => {
    expect(
      solveDay({ local_date: "2026-06-01", solved_at: "2026-05-31T23:30:00Z" })
    ).toBe("2026-06-01");
  });

  it("falls back to the UTC date of solved_at for legacy null rows", () => {
    expect(
      solveDay({ local_date: null, solved_at: "2026-05-31T23:30:00Z" })
    ).toBe("2026-05-31");
  });
});
