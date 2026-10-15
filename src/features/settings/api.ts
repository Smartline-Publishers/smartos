import { z } from "zod";
import { api } from "@/lib/api-client";
import { getRefreshToken } from "@/lib/auth";
import { AVATAR_MAX_SIDE, prepareImageUpload } from "@/lib/image";
import type { ApiEnvelope } from "@/types/api";
import type { Role } from "@/types/auth";

export interface Profile {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  avatarUrl?: string | null;
  totpEnabled: boolean;
}

export async function getProfile(): Promise<Profile> {
  const res = await api.get<ApiEnvelope<Profile>>("/users/me");
  return res.data;
}

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200).optional(),
  avatarUrl: z.string().max(700000).optional(),
  clearAvatar: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const parsed = UpdateProfileSchema.parse(input);
  const res = await api.patch<ApiEnvelope<Profile>>("/users/me", parsed);
  return res.data;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function toUploadForm(file: File, maxBytes: number): FormData {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > maxBytes) {
    throw new Error("That image is too large — 5MB max.");
  }
  const form = new FormData();
  form.append("file", file);
  return form;
}

/**
 * Upload a profile photo to hosted image storage. The image is first
 * downscaled to display size and re-encoded losslessly (PNG) in the browser
 * so uploads are small; returns the updated profile.
 */
export async function uploadAvatar(file: File): Promise<Profile> {
  const prepared = await prepareImageUpload(file, AVATAR_MAX_SIDE);
  const res = await api.upload<ApiEnvelope<Profile>>(
    "/users/me/avatar",
    toUploadForm(prepared.file, MAX_UPLOAD_BYTES),
  );
  return res.data;
}

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "At least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const parsed = ChangePasswordSchema.parse(input);
  await api.post<void>("/users/me/password", parsed);
}

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  current: boolean;
}

export async function listSessions(): Promise<Session[]> {
  const refresh = getRefreshToken();
  const res = await api.get<ApiEnvelope<Session[]>>("/users/me/sessions", {
    headers: refresh ? { "X-Refresh-Token": refresh } : undefined,
  });
  return res.data;
}

export async function revokeSession(id: string): Promise<void> {
  const refresh = getRefreshToken();
  await api.del<void>(`/users/me/sessions/${encodeURIComponent(id)}`, {
    headers: refresh ? { "X-Refresh-Token": refresh } : undefined,
  });
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  remainingBackupCodes: number;
}

export async function beginTwoFactorSetup(): Promise<TwoFactorSetup> {
  const res = await api.post<ApiEnvelope<TwoFactorSetup>>("/users/me/2fa/setup");
  return res.data;
}

export async function confirmTwoFactorSetup(code: string): Promise<{ backupCodes: string[] }> {
  const res = await api.post<ApiEnvelope<{ backupCodes: string[] }>>("/users/me/2fa/verify", {
    code,
  });
  return res.data;
}

export async function twoFactorStatus(): Promise<TwoFactorStatus> {
  const res = await api.get<ApiEnvelope<TwoFactorStatus>>("/users/me/2fa/status");
  return res.data;
}

export async function disableTwoFactor(currentPassword: string): Promise<void> {
  await api.post<void>("/users/me/2fa/disable", { currentPassword });
}

export type ChecklistKey = "logo" | "profile" | "theme" | "two-factor" | "team";

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  optional: boolean;
  href: string;
}

export interface OnboardingChecklist {
  items: ChecklistItem[];
  complete: boolean;
  dismissed: boolean;
}

export async function getOnboarding(): Promise<OnboardingChecklist> {
  const res = await api.get<ApiEnvelope<OnboardingChecklist>>("/onboarding");
  return res.data;
}

export async function updateOnboarding(input: {
  themeSkipped?: boolean;
  dismissed?: boolean;
}): Promise<OnboardingChecklist> {
  const res = await api.patch<ApiEnvelope<OnboardingChecklist>>("/onboarding", input);
  return res.data;
}
