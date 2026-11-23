import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/format";

describe("timeAgo", () => {
  const now = new Date("2026-10-13T12:00:00Z").getTime();

  it("labels recent moments", () => {
    expect(timeAgo("2026-10-13T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-13T11:45:00Z", now)).toBe("15m ago");
    expect(timeAgo("2026-10-13T10:00:00Z", now)).toBe("2h ago");
    expect(timeAgo("2026-10-10T12:00:00Z", now)).toBe("3d ago");
  });

  it("falls back to a date for older timestamps", () => {
    expect(timeAgo("2026-09-01T00:00:00Z", now)).toContain("2026");
  });

  it("handles missing and invalid input", () => {
    expect(timeAgo(null, now)).toBe("—");
    expect(timeAgo(undefined, now)).toBe("—");
    expect(timeAgo("not-a-date", now)).toBe("—");
  });
});
