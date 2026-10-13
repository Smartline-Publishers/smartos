import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api-client";

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fakeJwt(): string {
  const h = b64url({ alg: "none" });
  const p = b64url({ sub: "u1", email: "a@b.c", orgId: "o1", roles: ["admin"] });
  return `${h}.${p}.sig`;
}

describe("api-client", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches Authorization header from localStorage", async () => {
    window.localStorage.setItem("smartos.accessToken", fakeJwt());
    window.localStorage.setItem("smartos.refreshToken", "r1");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.get<{ ok: boolean }>("/books");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${fakeJwt()}`);
  });

  it("refreshes once on 401 then retries", async () => {
    window.localStorage.setItem("smartos.accessToken", "expired");
    window.localStorage.setItem("smartos.refreshToken", "r1");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { accessToken: "new-access", refreshToken: "r2" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const res = await api.get<{ ok: boolean }>("/books");

    expect(res).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(window.localStorage.getItem("smartos.accessToken")).toBe("new-access");
    const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(new Headers(retryInit.headers).get("Authorization")).toBe(
      "Bearer new-access",
    );
  });
});
