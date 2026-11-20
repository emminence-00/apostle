'use client';

import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/** Fetches an API route with the current Privy access token attached. */
export function useApiFetch() {
  const { getAccessToken } = usePrivy();

  return useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? `Request failed (${response.status})`);
      }
      return data as T;
    },
    [getAccessToken]
  );
}
