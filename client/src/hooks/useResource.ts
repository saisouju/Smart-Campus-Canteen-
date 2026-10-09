import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { errorMessage } from '@/api';

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/** Minimal fetch-on-mount hook; re-runs when `deps` change and ignores stale responses. */
export function useResource<T>(loader: () => Promise<T>, deps: DependencyList): Resource<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await load();
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === requestId.current) setError(errorMessage(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
