import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Role } from "@/types/auth";

export interface OrgUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
}

export const CreateUserSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  fullName: z.string().min(1, "Name is required").max(200),
  role: z.enum([
    "PLATFORM_ADMIN",
    "ORG_ADMIN",
    "EDITOR",
    "DESIGNER",
    "PRODUCTION",
    "WAREHOUSE",
    "SALES",
    "FINANCE",
    "AUTHOR",
    "VIEWER",
  ] as const satisfies readonly Role[]),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export async function listUsers(params: PagedParams): Promise<Page<OrgUser>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 20));
  if (params.search) q.set("search", params.search);
  const res = await api.get<ApiEnvelope<SpringPage<OrgUser>>>(`/users?${q.toString()}`);
  return toPage(res.data);
}

export async function createUser(input: CreateUserInput): Promise<OrgUser> {
  const parsed = CreateUserSchema.parse(input);
  const res = await api.post<ApiEnvelope<OrgUser>>("/users", parsed);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.del<void>(`/users/${encodeURIComponent(id)}`);
}
