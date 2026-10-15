import { afterEach, describe, expect, it, vi } from "vitest";
import { getSummary } from "@/features/dashboard/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSummary", () => {
  it("returns labelled sample data when the API is unreachable", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    const summary = await getSummary();
    expect(summary.stale).toBe(true);
    expect(summary.totalBooks).toBeGreaterThan(0);
    expect(summary.attention?.length).toBeGreaterThan(0);
    expect(summary.manuscriptPipeline?.length).toBeGreaterThan(0);
  });

  it("passes live data through without the stale flag", async () => {
    const live = {
      totalBooks: 3,
      publishedBooks: 1,
      totalContributors: 2,
      pendingRoyalties: 100,
    };
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: live }),
      }),
    );
    const summary = await getSummary();
    expect(summary.stale).toBe(false);
    expect(summary.totalBooks).toBe(3);
  });

  it("rethrows authentication failures instead of masking them as sample data", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    await expect(getSummary()).rejects.toMatchObject({ status: 401 });
  });
});
