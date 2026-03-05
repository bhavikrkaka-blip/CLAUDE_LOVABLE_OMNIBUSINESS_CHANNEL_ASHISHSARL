import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay (ms).
 * Returns the debounced value which only updates after the delay
 * has elapsed since the last change.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
