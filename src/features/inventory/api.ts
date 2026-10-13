import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { MovementType, StockLevel, StockMovement, Warehouse } from "@/types/inventory";

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  location: z.string().max(500).optional().or(z.literal("")),
});

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;

const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const satisfies readonly MovementType[];

export const CreateMovementSchema = z.object({
  bookId: z.string().min(1, "Choose a book"),
  warehouseId: z.string().min(1, "Choose a warehouse"),
  qtyDelta: z.coerce.number().int().refine((n) => n !== 0, "Must not be zero"),
  type: z.enum(MOVEMENT_TYPES),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type CreateMovementInput = z.infer<typeof CreateMovementSchema>;

export const TransferSchema = z.object({
  bookId: z.string().min(1, "Choose a book"),
  fromWarehouseId: z.string().min(1, "Choose a source"),
  toWarehouseId: z.string().min(1, "Choose a destination"),
  quantity: z.coerce.number().int().min(1, "At least 1 copy"),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type TransferInput = z.infer<typeof TransferSchema>;

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;
}

export async function listWarehouses(): Promise<Warehouse[]> {
  const res = await api.get<ApiEnvelope<Warehouse[]>>("/warehouses");
  return res.data;
}

export async function createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
  const parsed = CreateWarehouseSchema.parse(input);
  const res = await api.post<ApiEnvelope<Warehouse>>("/warehouses", clean(parsed));
  return res.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await api.del<void>(`/warehouses/${encodeURIComponent(id)}`);
}

export interface ListMovementsParams extends PagedParams {
  bookId?: string;
  warehouseId?: string;
}

export async function listMovements(params: ListMovementsParams): Promise<Page<StockMovement>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.bookId) q.set("bookId", params.bookId);
  if (params.warehouseId) q.set("warehouseId", params.warehouseId);
  const res = await api.get<ApiEnvelope<SpringPage<StockMovement>>>(
    `/inventory/movements?${q.toString()}`,
  );
  return toPage(res.data);
}

export async function recordMovement(input: CreateMovementInput): Promise<StockMovement> {
  const parsed = CreateMovementSchema.parse(input);
  const res = await api.post<ApiEnvelope<StockMovement>>(
    "/inventory/movements",
    clean(parsed),
  );
  return res.data;
}

export interface LevelParams {
  bookId?: string;
  warehouseId?: string;
  below?: number;
}

export async function listLevels(params: LevelParams): Promise<StockLevel[]> {
  const q = new URLSearchParams();
  if (params.bookId) q.set("bookId", params.bookId);
  if (params.warehouseId) q.set("warehouseId", params.warehouseId);
  if (params.below !== undefined) q.set("below", String(params.below));
  const res = await api.get<ApiEnvelope<StockLevel[]>>(`/inventory/levels?${q.toString()}`);
  return res.data;
}

export async function transferStock(input: TransferInput): Promise<StockMovement[]> {
  const parsed = TransferSchema.parse(input);
  const res = await api.post<ApiEnvelope<StockMovement[]>>(
    "/inventory/transfers",
    clean(parsed),
  );
  return res.data;
}
