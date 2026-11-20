import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requirePrivyUser } from '@/lib/server/auth';
import { getDepositConfig } from '@/lib/server/deposit-verification';
import { getUserData } from '@/lib/server/user';

export async function GET(req: NextRequest) {
  try {
    const privyId = await requirePrivyUser(req);
    const data = await getUserData(privyId);
    const config = getDepositConfig();

    return NextResponse.json({
      ...data,
      config: {
        chainId: config.chainId,
        chainName: config.chainName,
        usdcAddress: config.usdcAddress,
        walletAddress: config.walletAddress,
        minDeposit: config.minDeposit,
        configured: config.configured,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
