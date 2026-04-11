import { useState, useEffect } from 'react';

/**
 * A hook for debouncing fast-changing values (like search inputs).
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * A hook for fetching paginated/filterable data from the admin API.
 */
export function useAdminData<T>(
  fetchFn: (params: any) => Promise<T>,
  params: Record<string, any>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn(params);
        if (isMounted) setData(result);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), reloadKey, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: () => setReloadKey((value) => value + 1),
  };
}
