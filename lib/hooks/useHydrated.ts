"use client";
import { useEffect, useState } from "react";

/**
 * Returns `false` on the first render (SSR + initial client paint), then
 * `true` after the component mounts on the client. Use this to guard
 * persisted-state reads to avoid SSR/CSR hydration mismatches:
 *
 *   const hydrated = useHydrated();
 *   const cards = useDeckStore(s => s.cards);
 *   if (!hydrated) return <ViewSkeleton />;
 *   return <ActualView cards={cards} />;
 *
 * The skeleton SHOULD match the SSR output structurally so the layout
 * doesn't shift on hydration.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
