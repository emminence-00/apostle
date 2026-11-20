import { PrivyClient } from '@privy-io/node';
import type { NextRequest } from 'next/server';

let cachedClient: PrivyClient | null = null;

export function privyClient(): PrivyClient {
  if (cachedClient) return cachedClient;

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('Privy is not configured (NEXT_PUBLIC_PRIVY_APP_ID / PRIVY_APP_SECRET)');
  }

  cachedClient = new PrivyClient({
    appId,
    appSecret,
    ...(process.env.PRIVY_JWT_VERIFICATION_KEY
      ? { jwtVerificationKey: process.env.PRIVY_JWT_VERIFICATION_KEY }
      : {}),
  });
  return cachedClient;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401
  ) {
    super(message);
  }
}

/**
 * Verifies the Privy access token on every request. The user ID comes from the
 * verified token only — never from the request body.
 */
export async function requirePrivyUser(req: NextRequest): Promise<string> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new AuthError('Missing access token');

  try {
    const claims = await privyClient().utils().auth().verifyAccessToken(token);
    if (claims.issuer !== 'privy.io') throw new Error('Invalid issuer');
    if (claims.app_id !== process.env.NEXT_PUBLIC_PRIVY_APP_ID) throw new Error('Invalid app ID');
    return claims.user_id;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Invalid or expired access token');
  }
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : 'Internal error';
  console.error('[api]', message);
  return Response.json({ error: 'Internal error' }, { status: 500 });
}
