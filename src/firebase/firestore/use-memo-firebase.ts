'use client';

import { useMemo } from 'react';

/**
 * A hook to memoize a Firebase query or document reference.
 * It's a wrapper around useMemo that adds a non-enumerable property (__memo)
 * to the returned value. This is used by useCollection/useDoc hooks to
 * ensure that the query/reference they receive is stable and won't cause
 * unnecessary re-renders or listener detachments.
 *
 * @param factory The factory function to create the value (e.g., a Firestore query).
 * @param deps The dependencies to pass to useMemo.
 * @returns The memoized value.
 */
export const useMemoFirebase = <T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);

  if (value && typeof value === 'object') {
    // Add the __memo property to satisfy the custom hooks' requirement
    Object.defineProperty(value, '__memo', {
      value: true,
      enumerable: false,
      configurable: true,
    });
  }

  return value;
};
