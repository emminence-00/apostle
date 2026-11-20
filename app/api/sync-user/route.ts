import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requirePrivyUser } from '@/lib/server/auth';
import { getOrCreateUser } from '@/lib/server/user';

export async function POST(req: NextRequest) {
  try {
    const privyId = await requirePrivyUser(req);
    const body = await req.json().catch(() => ({}));
    const referralCode = typeof body?.referralCode === 'string' ? body.referralCode : null;

    const user = await getOrCreateUser(privyId, referralCode);
    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
