import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginTwoFactorSetup,
  changePassword,
  confirmTwoFactorSetup,
  getOnboarding,
  getProfile,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  updateOnboarding,
  updateProfile,
  uploadAvatar,
} from "@/features/settings/api";
import { updateCurrentOrg, clearOrgTheme, uploadOrgLogo } from "@/features/organization/api";

function ok<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ success: true, data }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("settings api", () => {
  it("fetches the profile from /users/me", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      expect(String(url)).toContain("/users/me");
      return ok({ id: "u1", totpEnabled: false });
    });
    vi.stubGlobal("fetch", fetchMock);

    const profile = await getProfile();
    expect(profile.id).toBe("u1");
  });

  it("patches the profile and changes the password", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        calls.push(`${init?.method} ${url}`);
        return url.endsWith("/users/me/password")
          ? Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) })
          : ok({ id: "u1" });
      }),
    );

    await updateProfile({ fullName: "New Name" });
    await changePassword({ currentPassword: "old", newPassword: "new-secret-1" });
    expect(calls).toContain("PATCH http://localhost:8080/api/v1/users/me");
    expect(calls).toContain("POST http://localhost:8080/api/v1/users/me/password");
  });

  it("runs the 2FA setup handshake", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (String(url).endsWith("/users/me/2fa/setup")) {
          return ok({ secret: "ABC", otpauthUrl: "otpauth://totp/x" }, 201);
        }
        return ok({ backupCodes: ["A", "B"] });
      }),
    );

    const setup = await beginTwoFactorSetup();
    expect(setup.secret).toBe("ABC");
    const confirm = await confirmTwoFactorSetup("123456");
    expect(confirm.backupCodes).toEqual(["A", "B"]);
  });

  it("lists and revokes sessions", async () => {
    const calls: string[] = [];
    window.localStorage.setItem("smartos.refreshToken", "r1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        calls.push(`${init?.method} ${url}`);
        if (String(url).endsWith("/users/me/sessions")) {
          expect(new Headers(init?.headers).get("X-Refresh-Token")).toBe("r1");
          if ((init?.method ?? "GET") === "GET") return ok([]);
        }
        return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) });
      }),
    );

    expect(await listSessions()).toEqual([]);
    await revokeSession("s1");
    await revokeOtherSessions();
    expect(calls).toContain("DELETE http://localhost:8080/api/v1/users/me/sessions/s1");
    expect(calls).toContain("DELETE http://localhost:8080/api/v1/users/me/sessions");
  });

  it("reads and updates onboarding", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        calls.push(`${init?.method} ${url}`);
        return ok({ items: [], complete: false, dismissed: false });
      }),
    );

    const list = await getOnboarding();
    expect(list.items).toEqual([]);
    await updateOnboarding({ dismissed: true });
    expect(calls).toContain("PATCH http://localhost:8080/api/v1/onboarding");
  });

  it("patches the organization and resets its theme", async () => {    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        calls.push(`${init?.method} ${url}`);
        if ((init?.method ?? "GET") === "DELETE") {
          return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) });
        }
        return ok({ id: "o1", slug: "acme" });
      }),
    );

    const org = await updateCurrentOrg({ slug: "acme" });
    expect(org.slug).toBe("acme");
    await clearOrgTheme();
    expect(calls).toContain("PATCH http://localhost:8080/api/v1/organizations/current");
    expect(calls).toContain("DELETE http://localhost:8080/api/v1/organizations/current/theme");
  });

  it("uploads images as multipart without a JSON content type", async () => {
    const seen: { url: string; contentType: string | null; isForm: boolean }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        seen.push({
          url: String(url),
          contentType: headers.get("Content-Type"),
          isForm: init?.body instanceof FormData,
        });
        return ok({ id: "x1", avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/a.png" });
      }),
    );
    const png = new File(["bytes"], "me.png", { type: "image/png" });

    await uploadAvatar(png);
    await uploadOrgLogo(png);

    expect(seen).toHaveLength(2);
    expect(seen[0].url).toBe("http://localhost:8080/api/v1/users/me/avatar");
    expect(seen[1].url).toBe("http://localhost:8080/api/v1/organizations/current/logo");
    for (const s of seen) {
      expect(s.isForm).toBe(true);
      expect(s.contentType).toBeNull();
    }
  });

  it("rejects non-image uploads client-side", async () => {
    const txt = new File(["hello"], "note.txt", { type: "text/plain" });
    await expect(uploadAvatar(txt)).rejects.toThrow("Choose an image file.");
    await expect(uploadOrgLogo(txt)).rejects.toThrow("Choose an image file.");
  });
});
