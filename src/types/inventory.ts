export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  location?: string;
}

/** Mirrors backend StockMovement.MovementType. */
export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  organizationId: string;
  bookId: string | null;
  warehouseId: string | null;
  qtyDelta: number;
  type: MovementType;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  createdAt?: string;
}

export interface StockLevel {
  bookId: string;
  bookTitle: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}
