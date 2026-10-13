import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Contract, RoyaltyStatement, StatementStatus } from "@/types/finance";

export const CreateContractSchema = z.object({
  contributorId: z.string().min(1, "Choose a contributor"),
  bookId: z.string().optional().or(z.literal("")),
  royaltyRate: z.coerce.number().min(0, "Rate must be between 0 and 1").max(1, "Rate must be between 0 and 1"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;

export const GenerateStatementSchema = z.object({
  contractId: z.string().min(1, "Choose a contract"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export type GenerateStatementInput = z.infer<typeof GenerateStatementSchema>;

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;
}

export async function listContracts(params: PagedParams): Promise<Page<Contract>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  const res = await api.get<ApiEnvelope<SpringPage<Contract>>>(`/royalties/contracts?${q.toString()}`);
  return toPage(res.data);
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const parsed = CreateContractSchema.parse(input);
  const res = await api.post<ApiEnvelope<Contract>>("/royalties/contracts", clean(parsed));
  return res.data;
}

export async function terminateContract(id: string): Promise<Contract> {
  const res = await api.post<ApiEnvelope<Contract>>(
    `/royalties/contracts/${encodeURIComponent(id)}/terminate`,
  );
  return res.data;
}

export async function deleteContract(id: string): Promise<void> {
  await api.del<void>(`/royalties/contracts/${encodeURIComponent(id)}`);
}

export interface ListStatementsParams extends PagedParams {
  status?: StatementStatus | "";
}

export async function listStatements(params: ListStatementsParams): Promise<Page<RoyaltyStatement>> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.status) q.set("status", params.status);
  const res = await api.get<ApiEnvelope<SpringPage<RoyaltyStatement>>>(
    `/royalties/statements?${q.toString()}`,
  );
  return toPage(res.data);
}

export async function generateStatement(input: GenerateStatementInput): Promise<RoyaltyStatement> {
  const parsed = GenerateStatementSchema.parse(input);
  const res = await api.post<ApiEnvelope<RoyaltyStatement>>(
    "/royalties/statements/generate",
    parsed,
  );
  return res.data;
}

export async function approveStatement(id: string): Promise<RoyaltyStatement> {
  const res = await api.post<ApiEnvelope<RoyaltyStatement>>(
    `/royalties/statements/${encodeURIComponent(id)}/approve`,
  );
  return res.data;
}

export async function payStatement(id: string): Promise<RoyaltyStatement> {
  const res = await api.post<ApiEnvelope<RoyaltyStatement>>(
    `/royalties/statements/${encodeURIComponent(id)}/pay`,
  );
  return res.data;
}
