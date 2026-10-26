import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from "@/features/auth/api";

function ok<T>(data: T, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

interface Call {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
}

function stubFetch(data: unknown, status = 200): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
      });
      return ok(data, status);
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("password recovery api", () => {
  it("requests a reset link without leaking a stale Bearer token", async () => {
    window.localStorage.setItem("smartos.accessToken", "stale-token");
    const calls = stubFetch({ sent: true, devToken: "dev-token" });

    const result = await requestPasswordReset("trace@test.local");

    expect(result.devToken).toBe("dev-token");
    expect(calls[0].url).toContain("/auth/password/forgot");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual({ email: "trace@test.local" });
    expect(calls[0].headers.get("Authorization")).toBeNull();
  });

  it("validates a reset token", async () => {
    const calls = stubFetch({ valid: true });

    await validateResetToken("abc");

    expect(calls[0].url).toContain("/auth/password/reset/validate");
    expect(calls[0].body).toEqual({ token: "abc" });
  });

  it("posts the new password and confirmation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(new Response(null, { status: 204 }))),
    );

    await expect(
      resetPassword({
        token: "abc",
        newPassword: "Publ1shing-Desk!",
        confirmPassword: "Publ1shing-Desk!",
      }),
    ).resolves.toBeUndefined();
  });
});
