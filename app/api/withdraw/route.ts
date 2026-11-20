import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requirePrivyUser } from '@/lib/server/auth';
import { getOrCreateUser } from '@/lib/server/user';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const privyId = await requirePrivyUser(req);
    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 1e6) !== amount * 1e6) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
    }

    const user = await getOrCreateUser(privyId);
    const supabase = createServiceClient();

    // The Postgres function locks the user row, re-checks unlocked balance and
    // inserts the request atomically, so concurrent requests cannot double-spend.
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) {
      if (error.message.includes('Insufficient unlocked balance')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ withdrawal: data });
  } catch (error) {
    return authErrorResponse(error);
  }
}
