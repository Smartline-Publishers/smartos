/**
 * Client-side mirror of the server password rules. The server is still the
 * authority; this only gives immediate, specific feedback while typing.
 */
const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "1234567890",
  "123456789",
  "12345678",
  "qwerty123",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "admin123",
  "administrator",
  "iloveyou",
  "abc123456",
  "changeme",
  "changeme123",
  "smartos123",
  "smartline123",
]);

export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordCheck {
  /** 0 (empty or very weak) to 4 (strong). */
  score: number;
  label: string;
  issues: string[];
  valid: boolean;
  /** True while the field is still untouched/empty. */
  empty: boolean;
}

function isSequential(value: string): boolean {
  let ascending = 0;
  let descending = 0;
  for (let i = 1; i < value.length; i += 1) {
    const delta = value.charCodeAt(i) - value.charCodeAt(i - 1);
    if (delta === 1) ascending += 1;
    else if (delta === -1) descending += 1;
  }
  return Math.max(ascending, descending) >= value.length - 1;
}

export function checkPassword(password: string, email?: string): PasswordCheck {
  const issues: string[] = [];
  if (!password) {
    return {
      score: 0,
      label: "Empty",
      issues: ["Password is required"],
      valid: false,
      empty: true,
    };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  const normalized = password.toLowerCase();
  if (COMMON.has(normalized)) {
    issues.push("Too common — choose something less predictable");
  }
  if (/^\d+$/.test(normalized)) {
    issues.push("Cannot be only digits");
  }
  if (new Set(normalized).size <= 2) {
    issues.push("Too repetitive");
  }
  if (normalized.length >= PASSWORD_MIN_LENGTH && isSequential(normalized)) {
    issues.push("Cannot be a simple sequence");
  }
  const localPart = email?.trim().toLowerCase().split("@")[0] ?? "";
  if (localPart.length >= 4 && normalized.includes(localPart)) {
    issues.push("Must not contain your email address");
  }
  const hasLetter = /[a-z]/i.test(password);
  const hasDigitOrSymbol = /[\d\W_]/.test(password);
  if (!hasLetter || !hasDigitOrSymbol) {
    issues.push("Include letters and at least one number or symbol");
  }

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 14) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;
  if (issues.length > 0) score = Math.min(score, 1);
  if (password.length === 0) score = 0;

  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return {
    score,
    label: labels[score],
    issues,
    valid: issues.length === 0,
    empty: false,
  };
}
