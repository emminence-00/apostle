import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requirePrivyUser } from '@/lib/server/auth';
import {
  allowUnverifiedDeposits,
  getDepositConfig,
  VerificationError,
  verifyDepositTransaction,
} from '@/lib/server/deposit-verification';
import { getOrCreateUser, getPrivyProfile } from '@/lib/server/user';
import { createServiceClient } from '@/lib/supabase/server';
import { PLATFORM_FEE_RATE, REFERRAL_BONUS_RATE } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const privyId = await requirePrivyUser(req);
    const body = await req.json().catch(() => ({}));
    const user = await getOrCreateUser(privyId);

    if (!user.tos_accepted) {
      return NextResponse.json({ error: 'Accept the terms before depositing' }, { status: 403 });
    }

    const config = getDepositConfig();
    let amount: number;
    let chainId = config.chainId;
    let txHash = '';

    if (allowUnverifiedDeposits() && !body?.txHash) {
      // Local development only. This branch cannot run when NODE_ENV=production.
      amount = Number(body?.amount);
      txHash = `0x${randomBytes(32).toString('hex')}`;
      console.warn('[deposit] UNVERIFIED local deposit — no on-chain check performed');
    } else {
      const submittedTxHash = body?.txHash;
      if (typeof submittedTxHash !== 'string') {
        return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
      }
      txHash = submittedTxHash;
      const profile = await getPrivyProfile(privyId);
      try {
        const verified = await verifyDepositTransaction(submittedTxHash, profile.walletAddresses);
        amount = verified.amount;
        chainId = verified.chainId;
      } catch (error) {
        if (error instanceof VerificationError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      }
    }

    if (!Number.isFinite(amount) || amount < config.minDeposit) {
      return NextResponse.json(
        { error: `Minimum deposit is ${config.minDeposit} USDC` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // The database function locks the user row and enforces one active 14-day
    // cycle atomically, so concurrent requests cannot bypass the check.
    const { data: deposit, error: depositError } = await supabase.rpc('create_verified_deposit', {
      p_user_id: user.id,
      p_amount: amount,
      p_tx_hash: txHash,
      p_chain_id: chainId,
    });

    if (depositError) {
      if (depositError.code === '23505') {
        return NextResponse.json({ error: 'This transaction was already recorded' }, { status: 409 });
      }
      if (depositError.message.includes('already in its 14-day cycle')) {
        return NextResponse.json(
          { error: 'A deposit is already in its 14-day cycle' },
          { status: 409 }
        );
      }
      throw depositError;
    }

    if (user.referred_by) {
      const platformFee = amount * PLATFORM_FEE_RATE;
      const referralBonus = platformFee * REFERRAL_BONUS_RATE;

      const { data: referral } = await supabase
        .from('referrals')
        .select('id, fee_earned')
        .eq('referrer_id', user.referred_by)
        .eq('referred_id', user.id)
        .maybeSingle();

      if (referral) {
        const { error: updateError } = await supabase
          .from('referrals')
          .update({ fee_earned: (Number(referral.fee_earned) || 0) + referralBonus })
          .eq('id', referral.id);
        if (updateError) console.warn('[deposit] Could not update referral:', updateError.message);
      }
    }

    return NextResponse.json({ deposit });
  } catch (error) {
    return authErrorResponse(error);
  }
}
