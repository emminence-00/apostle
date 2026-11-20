import { nanoid } from 'nanoid';
import { createServiceClient } from '@/lib/supabase/server';
import { privyClient } from '@/lib/server/auth';
import type { Deposit, User, Withdrawal } from '@/lib/types';

type PrivyAccount = { type: string; address?: string; email?: string };

export type PrivyProfile = {
  email: string | null;
  walletAddresses: string[];
};

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export async function getPrivyProfile(privyId: string): Promise<PrivyProfile> {
  const user = await privyClient().users()._get(privyId);
  const accounts = (user.linked_accounts ?? []) as PrivyAccount[];

  return {
    email: accounts.find((a) => a.type === 'email')?.email ?? null,
    walletAddresses: accounts
      .map((a) => a.address)
      .filter((address): address is string => typeof address === 'string' && EVM_ADDRESS.test(address)),
  };
}

/** Finds or creates the Apostle user record for a verified Privy identity. */
export async function getOrCreateUser(
  privyId: string,
  referralCode?: string | null
): Promise<User> {
  const supabase = createServiceClient();

  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('privy_id', privyId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing as User;

  const profile = await getPrivyProfile(privyId);

  let referredBy: string | null = null;
  if (referralCode) {
    const { data: referrer } = await supabase
      .from('users')
      .select('id, privy_id')
      .eq('referral_code', referralCode)
      .maybeSingle();
    if (referrer && referrer.privy_id !== privyId) referredBy = referrer.id;
  }

  const newReferralCode = nanoid(8).toUpperCase();
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({
      privy_id: privyId,
      email: profile.email,
      wallet_address: profile.walletAddresses[0] ?? null,
      referral_code: newReferralCode,
      referred_by: referredBy,
    })
    .select()
    .single();

  if (insertError) {
    // Another request may have created the user concurrently.
    if (insertError.code === '23505') {
      const { data: raced } = await supabase
        .from('users')
        .select('*')
        .eq('privy_id', privyId)
        .single();
      if (raced) return raced as User;
    }
    throw insertError;
  }

  const user = created as User;
  if (referredBy) {
    const { error: referralError } = await supabase
      .from('referrals')
      .upsert(
        { referrer_id: referredBy, referred_id: user.id },
        { onConflict: 'referred_id', ignoreDuplicates: true }
      );
    if (referralError) console.warn('[user] Could not record referral:', referralError.message);
  }

  return user;
}

export type ReferredRow = {
  id: string;
  fee_earned: number;
  created_at: string;
  referred_email: string | null;
  referred_wallet: string | null;
};

export type UserData = {
  user: User;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  referrals: ReferredRow[];
};

/** All dashboard reads go through the service role, scoped to the verified user. */
export async function getUserData(privyId: string): Promise<UserData> {
  const supabase = createServiceClient();
  const user = await getOrCreateUser(privyId);

  const [deposits, withdrawals, referrals] = await Promise.all([
    supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(100),
    supabase
      .from('referrals')
      .select(`
        id,
        fee_earned,
        created_at,
        referred:referred_id (email, wallet_address)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (deposits.error) throw deposits.error;
  if (withdrawals.error) throw withdrawals.error;
  if (referrals.error) throw referrals.error;

  type RawReferral = {
    id: string;
    fee_earned: number;
    created_at: string;
    referred: { email: string | null; wallet_address: string | null } | null;
  };

  const mappedReferrals: ReferredRow[] = (referrals.data as unknown as RawReferral[]).map((r) => ({
    id: r.id,
    fee_earned: Number(r.fee_earned) || 0,
    created_at: r.created_at,
    referred_email: r.referred?.email ?? null,
    referred_wallet: r.referred?.wallet_address ?? null,
  }));

  return {
    user,
    deposits: (deposits.data ?? []) as Deposit[],
    withdrawals: (withdrawals.data ?? []) as Withdrawal[],
    referrals: mappedReferrals,
  };
}
