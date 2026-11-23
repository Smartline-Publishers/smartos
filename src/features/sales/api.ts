import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Customer, CustomerType, Order, OrderStatus } from "@/types/sales";

const CUSTOMER_TYPES = [
  "INDIVIDUAL",
  "SCHOOL",
  "BOOKSHOP",
  "DISTRIBUTOR",
  "OTHER",
] as const satisfies readonly CustomerType[];

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(CUSTOMER_TYPES).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(64).optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0, "Must not be negative").optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const OrderItemSchema = z.object({
  bookId: z.string().min(1, "Choose a book"),
  quantity: z.coerce.number().int().min(1, "At least 1"),
  unitPrice: z.coerce.number().min(0, "Must not be negative"),
});

export type OrderItemInput = z.infer<typeof OrderItemSchema>;

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1, "Choose a customer"),
  items: z.array(OrderItemSchema).min(1, "Add at least one item"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;
}

export async function listCustomers(params: PagedParams): Promise<Page<Customer>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.search) q.set("search", params.search);
  const res = await api.get<ApiEnvelope<SpringPage<Customer>>>(`/customers?${q.toString()}`);
  return toPage(res.data);
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const parsed = CreateCustomerSchema.parse(input);
  const res = await api.post<ApiEnvelope<Customer>>("/customers", clean(parsed));
  return res.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.del<void>(`/customers/${encodeURIComponent(id)}`);
}

export interface ListOrdersParams extends PagedParams {
  status?: OrderStatus | "";
  customerId?: string;
}

export async function listOrders(params: ListOrdersParams): Promise<Page<Order>> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.status) q.set("status", params.status);
  if (params.customerId) q.set("customerId", params.customerId);
  const res = await api.get<ApiEnvelope<SpringPage<Order>>>(`/orders?${q.toString()}`);
  return toPage(res.data);
}

export async function getOrder(id: string): Promise<Order> {
  const res = await api.get<ApiEnvelope<Order>>(`/orders/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const parsed = CreateOrderSchema.parse(input);
  const res = await api.post<ApiEnvelope<Order>>("/orders", parsed);
  return res.data;
}

async function orderAction(id: string, action: "confirm" | "cancel"): Promise<Order> {
  const res = await api.post<ApiEnvelope<Order>>(
    `/orders/${encodeURIComponent(id)}/${action}`,
  );
  return res.data;
}

export const confirmOrder = (id: string) => orderAction(id, "confirm");
export const cancelOrder = (id: string) => orderAction(id, "cancel");

export async function fulfilOrder(id: string, warehouseId: string): Promise<Order> {
  const res = await api.post<ApiEnvelope<Order>>(
    `/orders/${encodeURIComponent(id)}/fulfil`,
    { warehouseId },
  );
  return res.data;
}
