import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requirePrivyUser } from '@/lib/server/auth';
import { getOrCreateUser } from '@/lib/server/user';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const privyId = await requirePrivyUser(req);
    const user = await getOrCreateUser(privyId);

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('users')
      .update({ tos_accepted: true })
      .eq('id', user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
