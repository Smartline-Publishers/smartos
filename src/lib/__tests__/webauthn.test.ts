import { describe, expect, it } from "vitest";
import {
  describePasskeyError,
  fromBase64Url,
  prepareCreationOptions,
  prepareRequestOptions,
  toBase64Url,
} from "@/lib/webauthn";

describe("webauthn base64url helpers", () => {
  it("round-trips arbitrary bytes without padding", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128, 64]);
    const encoded = toBase64Url(bytes);
    expect(encoded).not.toContain("=");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(Array.from(fromBase64Url(encoded))).toEqual(Array.from(bytes));
  });
});

describe("prepareCreationOptions", () => {
  it("converts base64url fields to ArrayBuffers", () => {
    const options = prepareCreationOptions({
      challenge: "AQID",
      rp: { id: "localhost", name: "SmartOS" },
      user: { id: "AQID", name: "admin@acme.test", displayName: "Admin" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      excludeCredentials: [{ type: "public-key", id: "AQID", transports: ["internal"] }],
    });

    expect(Array.from(new Uint8Array(options.challenge as ArrayBuffer))).toEqual([1, 2, 3]);
    expect(Array.from(new Uint8Array(options.user.id as ArrayBuffer))).toEqual([1, 2, 3]);
    expect(options.rp.id).toBe("localhost");
    expect(
      Array.from(new Uint8Array(options.excludeCredentials![0].id as ArrayBuffer)),
    ).toEqual([1, 2, 3]);
  });
});

describe("prepareRequestOptions", () => {
  it("passes allowCredentials through with decoded ids", () => {
    const options = prepareRequestOptions({
      challenge: "AQID",
      rpId: "localhost",
      allowCredentials: [{ type: "public-key", id: "AQID" }],
    });

    expect(Array.from(new Uint8Array(options.challenge as ArrayBuffer))).toEqual([1, 2, 3]);
    expect(
      Array.from(new Uint8Array(options.allowCredentials![0].id as ArrayBuffer)),
    ).toEqual([1, 2, 3]);
  });
});

describe("describePasskeyError", () => {
  it("maps common DOMExceptions to friendly copy", () => {
    expect(
      describePasskeyError(new DOMException("cancelled", "NotAllowedError")),
    ).toContain("cancelled");
    expect(
      describePasskeyError(new DOMException("already", "InvalidStateError")),
    ).toContain("already registered");
  });
});
