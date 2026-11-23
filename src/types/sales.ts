/** Mirrors backend Customer.CustomerType. */
export type CustomerType =
  | "INDIVIDUAL"
  | "SCHOOL"
  | "BOOKSHOP"
  | "DISTRIBUTOR"
  | "OTHER";

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
}

/** Mirrors backend Order.OrderStatus. */
export type OrderStatus = "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "FULFILLED",
  "CANCELLED",
];

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "CONFIRMED":
      return "Confirmed";
    case "FULFILLED":
      return "Fulfilled";
    case "CANCELLED":
      return "Cancelled";
  }
}

export interface OrderItem {
  id: string;
  bookId: string | null;
  bookTitle?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  organizationId: string;
  customerId: string | null;
  customerName?: string | null;
  status: OrderStatus;
  total: number;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
}
