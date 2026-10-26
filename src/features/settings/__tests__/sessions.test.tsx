import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecuritySettings } from "@/features/settings/SecuritySettings";

// SecuritySettings renders the account email and can end the session.
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "admin@acme.test", orgId: "o1", roles: ["ORG_ADMIN"] },
    session: null,
    permissions: [],
    loading: false,
    login: async () => ({ kind: "tokens", tokens: { accessToken: "", refreshToken: "" } }),
    loginWithPasskey: async () => ({ kind: "tokens", tokens: { accessToken: "", refreshToken: "" } }),
    loginWithTwoFactor: async () => {},
    logout: () => {},
    refreshSession: () => {},
    reloadSession: async () => {},
  }),
}));

function ok<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ success: true, data }),
  });
}

function noContent() {
  return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve({}) });
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("active sessions", () => {
  it("ends all other sessions while keeping the current one", async () => {
    const calls: { method: string; url: string; refresh: string | null }[] = [];
    window.localStorage.setItem("smartos.refreshToken", "r1");
    const sessions = [
      {
        id: "s1",
        createdAt: "2026-01-01T10:00:00Z",
        expiresAt: "2026-02-01T10:00:00Z",
        revoked: false,
        current: true,
      },
      {
        id: "s2",
        createdAt: "2026-01-02T10:00:00Z",
        expiresAt: "2026-02-02T10:00:00Z",
        revoked: false,
        current: false,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        calls.push({
          method,
          url: String(url),
          refresh: new Headers(init?.headers).get("X-Refresh-Token"),
        });
        if (String(url).endsWith("/users/me/2fa/status")) {
          return ok({ enabled: false, remainingBackupCodes: 0 });
        }
        if (String(url).endsWith("/users/me/sessions")) {
          return method === "DELETE" ? noContent() : ok(sessions);
        }
        return ok({});
      }),
    );

    render(<SecuritySettings onChanged={() => Promise.resolve()} />);

    const button = await screen.findByRole("button", { name: "End All Other Sessions" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("All other sessions ended.")).toBeTruthy();
    });

    const endAll = calls.find(
      (c) => c.method === "DELETE" && c.url.endsWith("/users/me/sessions"),
    );
    expect(endAll).toBeTruthy();
    expect(endAll?.refresh).toBe("r1");
  });
});
