import { afterEach, describe, expect, it } from "vitest";
import { parseJwt } from "@/lib/auth";

function b64url(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function token(payload: Record<string, unknown>): string {
  return `${b64url({ alg: "HS384" })}.${b64url(payload)}.sig`;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("parseJwt", () => {
  it("decodes a live access token", () => {
    const claims = parseJwt(
      token({
        sub: "u1",
        orgId: "o1",
        roles: ["ORG_ADMIN"],
        email: "admin@acme.test",
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    );

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("u1");
    expect(claims?.orgId).toBe("o1");
    expect(claims?.roles).toEqual(["ORG_ADMIN"]);
  });

  it("treats an expired token as no session", () => {
    const claims = parseJwt(
      token({
        sub: "u1",
        orgId: "o1",
        roles: [],
        exp: Math.floor(Date.now() / 1000) - 60,
      }),
    );

    expect(claims).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(parseJwt("not-a-jwt")).toBeNull();
    expect(parseJwt(`${b64url({ alg: "none" })}.${b64url({ sub: "u1" })}.sig`)).toBeNull();
  });
});
