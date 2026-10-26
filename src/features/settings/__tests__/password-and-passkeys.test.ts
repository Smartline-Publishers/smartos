import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changePassword,
  deletePasskey,
  registerPasskey,
  renamePasskey,
} from "@/features/settings/api";

interface Call {
  url: string;
  method: string;
  headers: Headers;
  body: Record<string, unknown> | null;
}

function stub(
  handler: (call: Call) => unknown,
): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const call: Call = {
        url: String(url),
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
      };
      calls.push(call);
      const payload = handler(call);
      if (payload === undefined) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: payload }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("changePassword", () => {
  it("sends the current refresh token and adopts the rotated pair", async () => {
    window.localStorage.setItem("smartos.accessToken", "old-access");
    window.localStorage.setItem("smartos.refreshToken", "old-refresh");
    const calls = stub(() => ({ accessToken: "new-access", refreshToken: "new-refresh" }));

    const result = await changePassword({
      currentPassword: "old-secret",
      newPassword: "Publ1shing-Desk!",
      confirmPassword: "Publ1shing-Desk!",
      keepCurrentSession: true,
    });

    expect(result.accessToken).toBe("new-access");
    expect(window.localStorage.getItem("smartos.accessToken")).toBe("new-access");
    expect(window.localStorage.getItem("smartos.refreshToken")).toBe("new-refresh");
    expect(calls[0].url).toContain("/users/me/password");
    expect(calls[0].headers.get("X-Refresh-Token")).toBe("old-refresh");
    expect(calls[0].body).toMatchObject({
      currentPassword: "old-secret",
      confirmPassword: "Publ1shing-Desk!",
      keepCurrentSession: true,
    });
  });

  it("does not invent tokens when the session is not kept", async () => {
    window.localStorage.setItem("smartos.accessToken", "old-access");
    window.localStorage.setItem("smartos.refreshToken", "old-refresh");
    stub(() => ({}));

    const result = await changePassword({
      currentPassword: "old-secret",
      newPassword: "Publ1shing-Desk!",
      keepCurrentSession: false,
    });

    expect(result.accessToken).toBeUndefined();
    // The server invalidated the old pair; the dead credentials must be gone.
    expect(window.localStorage.getItem("smartos.accessToken")).toBeNull();
    expect(window.localStorage.getItem("smartos.refreshToken")).toBeNull();
  });
});

describe("passkey management", () => {
  it("registers a passkey with its attestation response", async () => {
    const calls = stub(() => ({
      id: "p1",
      credentialId: "AQID",
      nickname: "Laptop",
      createdAt: "2026-01-01T00:00:00Z",
      backupEligible: true,
      backupState: false,
      transports: ["internal"],
    }));

    const created = await registerPasskey(
      {
        credentialId: "AQID",
        clientDataJSON: "AQID",
        attestationObject: "AQID",
        transports: ["internal"],
      },
      "Laptop",
    );

    expect(created.nickname).toBe("Laptop");
    expect(calls[0].url).toContain("/users/me/passkeys");
    expect(calls[0].body).toMatchObject({ credentialId: "AQID", nickname: "Laptop" });
  });

  it("renames and deletes by id", async () => {
    const calls = stub((call) =>
      call.method === "PATCH" ? { id: "p1", nickname: "Work laptop" } : undefined,
    );

    await renamePasskey("p1", "Work laptop");
    await deletePasskey("p1");

    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].url).toContain("/users/me/passkeys/p1");
    expect(calls[0].body).toEqual({ nickname: "Work laptop" });
    expect(calls[1].method).toBe("DELETE");
    expect(calls[1].url).toContain("/users/me/passkeys/p1");
  });
});
