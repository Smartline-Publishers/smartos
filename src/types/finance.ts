/** Mirrors backend Transaction.TransactionType. */
export type TransactionType = "SALE" | "REFUND" | "EXPENSE" | "ROYALTY_PAYOUT";

export interface Transaction {
  id: string;
  organizationId: string;
  type: TransactionType;
  amount: number;
  category?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdAt?: string;
}

export interface Budget {
  id: string;
  organizationId: string;
  name: string;
  category?: string;
  periodStart: string;
  periodEnd: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
}

/** Mirrors backend Contract.ContractStatus. */
export type ContractStatus = "ACTIVE" | "TERMINATED";

export interface Contract {
  id: string;
  organizationId: string;
  contributorId: string | null;
  contributorName?: string | null;
  bookId?: string | null;
  royaltyRate: number;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
}

/** Mirrors backend RoyaltyStatement.StatementStatus. */
export type StatementStatus = "DRAFT" | "APPROVED" | "PAID";

export interface RoyaltyStatement {
  id: string;
  organizationId: string;
  contractId: string | null;
  periodStart: string;
  periodEnd: string;
  netSales: number;
  rateSnapshot: number;
  payable: number;
  status: StatementStatus;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
}
