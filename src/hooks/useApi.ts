import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';
import { errorMessage } from '../utils/api';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher().
    then((data) => {
      if (active) setState({ data, error: null, loading: false });
    }).
    catch((err: unknown) => {
      if (active) setState({ data: null, error: errorMessage(err), loading: false });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}