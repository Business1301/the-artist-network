"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe current timestamp hook for client components.
 * Returns 0 on initial SSR/hydration pass, then updates on mount and interval.
 */
export function useNowMs(intervalMs = 60_000): number {
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const immediate = setTimeout(() => setNowMs(Date.now()), 0);
    const timer = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return nowMs;
}
