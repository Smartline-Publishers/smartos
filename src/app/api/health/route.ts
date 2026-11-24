import { NextResponse } from "next/server";

/**
 * Runtime configuration probe. Deliberately excluded from Clerk middleware so
 * it stays reachable even when Clerk keys are missing or invalid.
 *
 * Reports only booleans/environment types — never key values.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const secret = (process.env.CLERK_SECRET_KEY ?? "").trim();
  const publishable = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").trim();

  const envOf = (key: string, prefix: "sk" | "pk") =>
    key.startsWith(`${prefix}_live_`) ? "live" : key.startsWith(`${prefix}_test_`) ? "test" : "unknown";

  const secretEnv = envOf(secret, "sk");
  const publishableEnv = envOf(publishable, "pk");

  const checks = {
    clerkSecretConfigured: secret.length > 0,
    clerkSecretFormatOk: /^sk_(test|live)_/.test(secret),
    clerkPublishableConfigured: publishable.length > 0,
    clerkPublishableFormatOk: /^pk_(test|live)_/.test(publishable),
    clerkKeysSameEnvironment:
      secretEnv !== "unknown" && publishableEnv !== "unknown" && secretEnv === publishableEnv,
    apiUrlConfigured: Boolean(process.env.NEXT_PUBLIC_API_URL),
  };

  return NextResponse.json(
    {
      ok: checks.clerkSecretConfigured && checks.clerkPublishableConfigured && checks.clerkKeysSameEnvironment,
      checks,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
