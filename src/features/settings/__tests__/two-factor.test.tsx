import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SecuritySettings } from "@/features/settings/SecuritySettings";

// SecuritySettings reads the caller's email and can end the session, so it
// needs the auth context. The test only exercises 2FA/session behaviour.
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

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string, init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: handler(url, init) }),
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("two-factor setup", () => {
  it("shows a scannable QR code and keeps manual entry available", async () => {
    stubFetch((url) => {
      if (String(url).endsWith("/users/me/2fa/status")) {
        return { enabled: false, remainingBackupCodes: 0 };
      }
      if (String(url).endsWith("/users/me/2fa/setup")) {
        return { secret: "JBSWY3DPEHPK3PXP", otpauthUrl: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP" };
      }
      if (String(url).endsWith("/users/me/sessions")) {
        return [];
      }
      return {};
    });
    render(<SecuritySettings onChanged={() => Promise.resolve()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Set up 2FA" }));

    const qr = await screen.findByRole("img", { name: "Two-factor setup QR code" });
    expect(qr.tagName.toLowerCase()).toBe("span");
    expect(qr.querySelector("svg")).not.toBeNull();

    // Manual key stays hidden until requested…
    expect(screen.queryByText("JBSWY3DPEHPK3PXP")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /enter the key manually/i }));
    await waitFor(() => {
      expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeTruthy();
    });
  });

  it("copies and downloads backup codes with feedback", async () => {
    stubFetch((url) => {
      if (String(url).endsWith("/users/me/2fa/status")) {
        return { enabled: false, remainingBackupCodes: 0 };
      }
      if (String(url).endsWith("/users/me/2fa/setup")) {
        return { secret: "JBSWY3DPEHPK3PXP", otpauthUrl: "otpauth://totp/x" };
      }
      if (String(url).endsWith("/users/me/2fa/verify")) {
        return { backupCodes: ["AAAA-BBBB", "CCCC-DDDD"] };
      }
      if (String(url).endsWith("/users/me/sessions")) {
        return [];
      }
      return {};
    });
    const written: string[] = [];
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText: (t: string) => { written.push(t); return Promise.resolve(); } },
      configurable: true,
    });
    const createdUrls: string[] = [];
    window.URL.createObjectURL = vi.fn(() => {
      createdUrls.push("blob:fake");
      return "blob:fake";
    });
    window.URL.revokeObjectURL = vi.fn();
    render(<SecuritySettings onChanged={() => Promise.resolve()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Set up 2FA" }));
    await screen.findByRole("img", { name: "Two-factor setup QR code" });
    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and enable" }));

    await screen.findByText("AAAA-BBBB");

    fireEvent.click(screen.getByRole("button", { name: "Copy all" }));
    await waitFor(() => {
      expect(screen.getByText("Backup codes copied to the clipboard.")).toBeTruthy();
    });
    expect(written).toEqual(["AAAA-BBBB\nCCCC-DDDD"]);
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(screen.getByText("Backup codes downloaded.")).toBeTruthy();
    });
    expect(createdUrls).toEqual(["blob:fake"]);
  });
});
