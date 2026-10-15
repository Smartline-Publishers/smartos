import { api } from "@/lib/api-client";
import { LOGO_MAX_SIDE, prepareImageUpload } from "@/lib/image";
import type { ApiEnvelope } from "@/types/api";
import type { OrgTheme } from "@/types/theme";

export interface OrganizationLimits {
  maxUsers: number;
  maxBooks: number;
}

export interface CurrentOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  limits: OrganizationLimits;
  settings?: Record<string, unknown>;
  logoUrl?: string | null;
  theme?: OrgTheme | null;
}

export async function getCurrentOrg(): Promise<CurrentOrganization> {
  const res = await api.get<ApiEnvelope<CurrentOrganization>>("/organizations/current");
  return res.data;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logoUrl?: string;
  clearLogo?: boolean;
  theme?: OrgTheme;
}

export async function updateCurrentOrg(input: UpdateOrganizationInput): Promise<CurrentOrganization> {
  const res = await api.patch<ApiEnvelope<CurrentOrganization>>("/organizations/current", input);
  return res.data;
}

export async function clearOrgTheme(): Promise<void> {
  await api.del<void>("/organizations/current/theme");
}

/**
 * Upload the organization logo to hosted image storage. The image is first
 * downscaled to display size and re-encoded losslessly (PNG) in the browser
 * so uploads are small. Returns the updated organization.
 */
export async function uploadOrgLogo(file: File): Promise<CurrentOrganization> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  const prepared = await prepareImageUpload(file, LOGO_MAX_SIDE);
  if (prepared.file.size > 5 * 1024 * 1024) {
    throw new Error("That image is too large — 5MB max.");
  }
  const form = new FormData();
  form.append("file", prepared.file);
  const res = await api.upload<ApiEnvelope<CurrentOrganization>>(
    "/organizations/current/logo",
    form,
  );
  return res.data;
}
