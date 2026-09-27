import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, errorMessage } from '../utils/api';

export function useAction() {
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setPending(true);
    setFieldErrors({});
    try {
      const result = await fn();
      if (success) toast.success(success);
      return result;
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors);
      toast.error(errorMessage(err));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, fieldErrors };
}