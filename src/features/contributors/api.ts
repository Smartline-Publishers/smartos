import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Contributor, ContributorType } from "@/types/book";

export const CONTRIBUTOR_TYPES = [
  "AUTHOR",
  "EDITOR",
  "ILLUSTRATOR",
  "TRANSLATOR",
  "OTHER",
] as const satisfies readonly ContributorType[];

export const ContributorSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(200),
  type: z.enum(CONTRIBUTOR_TYPES).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
});

export type ContributorInput = z.infer<typeof ContributorSchema>;

export async function listContributors(params: PagedParams): Promise<Page<Contributor>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.search) q.set("search", params.search);
  const res = await api.get<ApiEnvelope<SpringPage<Contributor>>>(
    `/contributors?${q.toString()}`,
  );
  return toPage(res.data);
}

export async function createContributor(input: ContributorInput): Promise<Contributor> {
  const parsed = ContributorSchema.parse(input);
  const res = await api.post<ApiEnvelope<Contributor>>("/contributors", parsed);
  return res.data;
}
