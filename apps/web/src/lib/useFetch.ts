'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(path: string | null): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<T>(path)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os dados.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, tick]);

  return { data, loading, error, refetch };
}
