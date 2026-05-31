import { describe, it, expect } from "vitest";
import {
  offsetDay,
  computeStreak,
  computeLongestStreak,
  computeLastDays,
} from "./streak";
import { solveDay } from "./local-date";

describe("offsetDay", () => {
  it("steps forward and back without tz drift", () => {
    expect(offsetDay("2026-05-31", 1)).toBe("2026-06-01");
    expect(offsetDay("2026-06-01", -1)).toBe("2026-05-31");
  });

  it("crosses month and year boundaries", () => {
    expect(offsetDay("2026-02-28", 1)).toBe("2026-03-01"); // 2026 not a leap year
    expect(offsetDay("2025-12-31", 1)).toBe("2026-01-01");
    expect(offsetDay("2024-02-28", 1)).toBe("2024-02-29"); // leap year
  });
});

describe("computeStreak — build-up", () => {
  const today = "2026-05-31";

  it("counts a clean run ending today", () => {
    const days = ["2026-05-29", "2026-05-30", "2026-05-31"];
    expect(computeStreak(days, today)).toBe(3);
  });

  it("ignores order and duplicate days", () => {
    const days = ["2026-05-31", "2026-05-29", "2026-05-31", "2026-05-30"];
    expect(computeStreak(days, today)).toBe(3);
  });

  it("is 1 when only today is solved", () => {
    expect(computeStreak(["2026-05-31"], today)).toBe(1);
  });

  it("is 0 with no solves at all", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("computeStreak — gaps", () => {
  const today = "2026-05-31";

  it("stops at the first gap below today", () => {
    // 28 missing → 29,30,31 form the current run
    const days = ["2026-05-26", "2026-05-27", "2026-05-29", "2026-05-30", "2026-05-31"];
    expect(computeStreak(days, today)).toBe(3);
  });

  it("a solve two days ago without yesterday does not extend the streak", () => {
    const days = ["2026-05-29", "2026-05-31"]; // 30 missing
    expect(computeStreak(days, today)).toBe(1);
  });
});

describe("computeStreak — today-safe", () => {
  const today = "2026-05-31";

  it("keeps the streak alive when today is not solved yet but yesterday was", () => {
    const days = ["2026-05-28", "2026-05-29", "2026-05-30"]; // through yesterday
    expect(computeStreak(days, today)).toBe(3);
  });

  it("collapses to 0 once a full day (yesterday) is missed", () => {
    const days = ["2026-05-27", "2026-05-28", "2026-05-29"]; // ends 2 days ago
    expect(computeStreak(days, today)).toBe(0);
  });

  it("prefers today when both today and yesterday are present (no double count)", () => {
    const days = ["2026-05-30", "2026-05-31"];
    expect(computeStreak(days, today)).toBe(2);
  });
});

describe("computeLongestStreak", () => {
  it("is 0 for an empty history", () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it("finds the longest run across multiple separated streaks", () => {
    const days = [
      "2026-01-01", "2026-01-02", // run of 2
      "2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13", // run of 4
      "2026-02-01", // run of 1
    ];
    expect(computeLongestStreak(days)).toBe(4);
  });

  it("counts a single solve as 1", () => {
    expect(computeLongestStreak(["2026-05-31"])).toBe(1);
  });

  it("dedupes repeated days", () => {
    expect(computeLongestStreak(["2026-05-30", "2026-05-30", "2026-05-31"])).toBe(2);
  });
});

describe("computeLastDays", () => {
  const today = "2026-05-31";

  it("returns n entries ending with today (newest last)", () => {
    const map = computeLastDays(["2026-05-31"], today, 7);
    expect(map).toHaveLength(7);
    expect(map[6]).toBe(true); // today
    expect(map.slice(0, 6).every((v) => v === false)).toBe(true);
  });

  it("marks each solved day in the window", () => {
    const days = ["2026-05-25", "2026-05-29", "2026-05-31"];
    // window: 25,26,27,28,29,30,31
    expect(computeLastDays(days, today, 7)).toEqual([
      true, false, false, false, true, false, true,
    ]);
  });

  it("ignores solves outside the window", () => {
    const days = ["2026-05-01", "2026-05-31"];
    const map = computeLastDays(days, today, 7);
    expect(map.filter(Boolean)).toHaveLength(1); // only today is inside the 7-day window
  });
});

describe("local-date bucketing via solveDay → streak", () => {
  const today = "2026-05-31";

  it("buckets by stored local_date, not the UTC slice of solved_at", () => {
    // A UTC+ user solving at 23:30 UTC on the 30th experiences local day = 31st.
    const rows = [
      { local_date: "2026-05-31", solved_at: "2026-05-30T23:30:00Z" },
      { local_date: "2026-05-30", solved_at: "2026-05-29T23:30:00Z" },
    ];
    const days = [...new Set(rows.map(solveDay))];
    expect(days.sort()).toEqual(["2026-05-30", "2026-05-31"]);
    expect(computeStreak(days, today)).toBe(2);
  });

  it("falls back to the UTC date of solved_at for legacy null local_date rows", () => {
    const rows = [
      { local_date: null, solved_at: "2026-05-30T12:00:00Z" },
      { local_date: null, solved_at: "2026-05-31T12:00:00Z" },
    ];
    const days = [...new Set(rows.map(solveDay))];
    expect(days.sort()).toEqual(["2026-05-30", "2026-05-31"]);
    expect(computeStreak(days, today)).toBe(2);
  });
});
