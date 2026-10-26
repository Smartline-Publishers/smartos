import { describe, expect, it } from "vitest";
import { checkPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";

describe("checkPassword", () => {
  it("accepts a long mixed password", () => {
    const result = checkPassword("Publ1shing-Desk!");
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it("rejects short passwords", () => {
    const result = checkPassword("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toContain(String(PASSWORD_MIN_LENGTH));
  });

  it("rejects common, numeric, repetitive and sequential passwords", () => {
    expect(checkPassword("password123").valid).toBe(false);
    expect(checkPassword("1234567890123").valid).toBe(false);
    expect(checkPassword("aaaaaaaaaaaa1").valid).toBe(false);
    expect(checkPassword("abcdefghij").valid).toBe(false);
  });

  it("rejects a password containing the email local part", () => {
    const result = checkPassword("Trace-Password-92", "trace@test.local");
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ").toLowerCase()).toContain("email");
  });

  it("requires letters plus a number or symbol", () => {
    expect(checkPassword("onlylettershere").valid).toBe(false);
  });
});
