"use client";

import { useEffect, useState } from "react";

/**
 * false during SSR + first client render (hydration), true after mount.
 * Use to gate any values that come from localStorage / browser APIs.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
