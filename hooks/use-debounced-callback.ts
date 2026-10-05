'use client';

import { useEffect, useMemo, useRef } from 'react';

export type DebouncedFn<A extends unknown[]> = ((...args: A) => void) & {
  /** Runs the pending call now (e.g. on Enter). */
  flush(): void;
  cancel(): void;
};

/**
 * Debounces `callback` by `delay` ms. The returned function is stable and
 * always calls the latest `callback`; a pending call is dropped on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number
): DebouncedFn<A> {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const debounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pendingArgs: A | undefined;

    const run = () => {
      clearTimeout(timer);
      timer = undefined;
      if (pendingArgs) {
        const args = pendingArgs;
        pendingArgs = undefined;
        callbackRef.current(...args);
      }
    };

    return Object.assign(
      (...args: A) => {
        pendingArgs = args;
        clearTimeout(timer);
        timer = setTimeout(run, delay);
      },
      {
        flush: run,
        cancel: () => {
          clearTimeout(timer);
          pendingArgs = undefined;
        },
      }
    );
  }, [delay]);

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
