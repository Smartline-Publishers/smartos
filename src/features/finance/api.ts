import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Budget, Transaction, TransactionType } from "@/types/finance";

const TRANSACTION_TYPES = ["SALE", "REFUND", "EXPENSE", "ROYALTY_PAYOUT"] as const satisfies readonly TransactionType[];

const MANUAL_TYPES = ["EXPENSE", "REFUND"] as const;

export const CreateTransactionSchema = z.object({
  type: z.enum(MANUAL_TYPES),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().max(120).optional().or(z.literal("")),
  referenceId: z.string().uuid("Must be a valid id").optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const CreateBudgetSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  category: z.string().max(120).optional().or(z.literal("")),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  plannedAmount: z.coerce.number().min(0, "Must not be negative"),
});

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;
}

export interface ListTransactionsParams extends PagedParams {
  type?: TransactionType | "";
  category?: string;
}

export async function listTransactions(params: ListTransactionsParams): Promise<Page<Transaction>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.type) q.set("type", params.type);
  if (params.category) q.set("category", params.category);
  const res = await api.get<ApiEnvelope<SpringPage<Transaction>>>(
    `/finance/transactions?${q.toString()}`,
  );
  return toPage(res.data);
}

export async function recordTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const parsed = CreateTransactionSchema.parse(input);
  const res = await api.post<ApiEnvelope<Transaction>>(
    "/finance/transactions",
    clean(parsed),
  );
  return res.data;
}

export async function listBudgets(params: PagedParams): Promise<Page<Budget>> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  const res = await api.get<ApiEnvelope<SpringPage<Budget>>>(`/finance/budgets?${q.toString()}`);
  return toPage(res.data);
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const parsed = CreateBudgetSchema.parse(input);
  const res = await api.post<ApiEnvelope<Budget>>("/finance/budgets", clean(parsed));
  return res.data;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.del<void>(`/finance/budgets/${encodeURIComponent(id)}`);
}

export { TRANSACTION_TYPES };
