import { describe, expect, it, vi, afterEach } from "vitest";
import { acceptInvite } from "@/features/invites/api";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("acceptInvite", () => {
  it("stores the returned tokens and submits the accepted legal versions", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
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
    vi.stubGlobal("fetch", fetchMock);
    const tokens = await acceptInvite({
      token: "plain-token",
      fullName: "Ed Editor",
      password: "secret123",
      termsVersion: "1.0",
      privacyVersion: "1.0",
    });
    expect(tokens).toEqual({ accessToken: "a1", refreshToken: "r1" });
    expect(localStorage.getItem("smartos.accessToken")).toBe("a1");
    expect(localStorage.getItem("smartos.refreshToken")).toBe("r1");

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.termsVersion).toBe("1.0");
    expect(body.privacyVersion).toBe("1.0");
  });
});
