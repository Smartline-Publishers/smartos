import { describe, expect, it, vi, afterEach } from "vitest";
import { acceptInvite } from "@/features/invites/api";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("acceptInvite", () => {
  it("stores the returned tokens", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            data: { accessToken: "a1", refreshToken: "r1", tokenType: "Bearer" },
          }),
      }),
    );
    const tokens = await acceptInvite({
      token: "plain-token",
      fullName: "Ed Editor",
      password: "secret123",
    });
    expect(tokens).toEqual({ accessToken: "a1", refreshToken: "r1" });
    expect(localStorage.getItem("smartos.accessToken")).toBe("a1");
    expect(localStorage.getItem("smartos.refreshToken")).toBe("r1");
  });
});
