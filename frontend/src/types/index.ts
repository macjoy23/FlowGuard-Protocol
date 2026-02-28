export interface PayrollBatch {
  batchId: string;
  payer: string;
  totalAmount: bigint;
  recipientCount: number;
  executedAt: number;
}

export interface Recipient {
  address: string;
  label: string;
  ensName?: string;
}

export interface ComplianceDocument {
  docHash: string;
  ipfsCid: string;
  registeredBy: string;
  registeredAt: number;
  verified: boolean;
}

export interface EntityStatus {
  isVerified: boolean;
  verifiedAt: number;
  verifiedBy: string;
}

export interface VaultPosition {
  deposited: bigint;
  yield: bigint;
  totalBalance: bigint;
}

export interface DashboardStats {
  usdcBalance: bigint;
  totalDisbursed: bigint;
  batchCount: number;
  vaultDeposit: bigint;
  vaultYield: bigint;
  complianceScore: number;
}

export interface TransactionState {
  status: "idle" | "approving" | "pending" | "confirming" | "confirmed" | "failed";
  hash?: string;
  error?: string;
}

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};
