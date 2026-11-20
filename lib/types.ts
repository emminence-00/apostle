export type UserStatus = "active" | "suspended";
export type DepositStatus = "pending" | "confirmed" | "failed";
export type WithdrawalStatus = "pending" | "approved" | "processed" | "rejected";

export interface User {
  id: string;
  privy_id: string;
  email: string | null;
  wallet_address: string | null;
  referral_code: string;
  referred_by: string | null;
  tos_accepted?: boolean;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  tx_hash: string | null;
  chain_id?: number | null;
  status: DepositStatus;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at: string | null;
  unlocks_at: string;
  destination_address?: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  fee_earned: number;
  bonus_paid: number;
  created_at: string;
}

export interface DepositDisplayConfig {
  chainId: number;
  chainName: string;
  usdcAddress: string | null;
  walletAddress: string | null;
  minDeposit: number;
  configured: boolean;
}

export interface ReferredRow {
  id: string;
  fee_earned: number;
  created_at: string;
  referred_email: string | null;
  referred_wallet: string | null;
}
