import { z } from "zod";
import { api } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/api";
import type { AuthTokens, Role } from "@/types/auth";

export interface Invite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  acceptedAt?: string;
  /** Present only in the create response — shown once, never stored. */
  token?: string;
  /** True when the invitation email was handed to the outbound mail service. */
  emailSent?: boolean;
}

export const CreateInviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum([
    "ORG_ADMIN",
    "EDITOR",
    "DESIGNER",
    "PRODUCTION",
    "WAREHOUSE",
    "SALES",
    "FINANCE",
    "AUTHOR",
    "VIEWER",
  ] as const satisfies readonly Exclude<Role, "PLATFORM_ADMIN">[]),
  daysValid: z.coerce.number().int().min(1).max(30).optional(),
});

export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  fullName: z.string().min(1, "Name is required").max(200),
  password: z.string().min(8, "At least 8 characters"),
});

export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;

export interface AcceptInvitePayload extends AcceptInviteInput {
  /** Exact legal versions loaded from GET /legal/documents. */
  termsVersion: string;
  privacyVersion: string;
}

export async function listInvites(): Promise<Invite[]> {
  const res = await api.get<ApiEnvelope<Invite[]>>("/invites");
  return res.data;
}

export async function createInvite(input: CreateInviteInput): Promise<Invite> {
  const parsed = CreateInviteSchema.parse(input);
  const res = await api.post<ApiEnvelope<Invite>>("/invites", parsed);
  return res.data;
}

export async function revokeInvite(id: string): Promise<void> {
  await api.del<void>(`/invites/${encodeURIComponent(id)}`);
}

export async function acceptInvite(input: AcceptInvitePayload): Promise<AuthTokens> {
  const parsed = AcceptInviteSchema.parse(input);
  const res = await api.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
    "/invites/accept",
    {
      ...parsed,
      termsVersion: input.termsVersion,
      privacyVersion: input.privacyVersion,
    },
  );
  const tokens: AuthTokens = {
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}
