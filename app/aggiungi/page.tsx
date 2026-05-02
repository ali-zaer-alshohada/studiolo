import { Suspense } from "react";
import { AggiungiView } from "@/components/aggiungi/AggiungiView";

/**
 * Aggiungi — page v.
 * Two contenteditable "ruled paper" zones, no form chrome. See AggiungiView.
 *
 * Wrapped in Suspense because AggiungiView calls useSearchParams (for the
 * `?edit=<id>` deep-link from /carte). Next.js 16's static export requires
 * a Suspense boundary around any client component reading search params,
 * otherwise prerender fails with the missing-suspense-with-csr-bailout error.
 */
export default function AggiungiPage() {
  return (
    <Suspense fallback={null}>
      <AggiungiView />
    </Suspense>
  );
}
