import { api } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";

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
}

export async function getCurrentOrg(): Promise<CurrentOrganization> {
  const res = await api.get<ApiEnvelope<CurrentOrganization>>("/organizations/current");
  return res.data;
}
