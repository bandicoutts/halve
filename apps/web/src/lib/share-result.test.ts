import { describe, expect, it, vi } from "vitest";
import { shareResult } from "./share-result";

describe("shareResult", () => {
  it("uses native sharing without also copying", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await shareResult("Halve 2:47", { share, writeText })).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "Halve 2:47" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("leaves the clipboard alone when the share sheet is cancelled", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    const writeText = vi.fn();
    expect(await shareResult("result", { share, writeText })).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareResult("Halve 2:47", { writeText })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Halve 2:47");
  });

  it("falls back to copy after a native share failure", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareResult("result", {
      share: vi.fn().mockRejectedValue(new Error("Unavailable")), writeText,
    })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("result");
  });

  it("reports failure when copying is denied or neither API exists", async () => {
    expect(await shareResult("result", {
      writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
    })).toBe("failed");
    expect(await shareResult("result", {})).toBe("failed");
  });
});
