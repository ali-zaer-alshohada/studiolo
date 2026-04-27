"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keydown listener: Esc returns the user to Coda (`/`).
 *
 * Smart behavior: if focus is in a contenteditable / input / textarea AND the
 * field has content, blur the field instead of navigating. This lets the user
 * clear their input with Esc first and then Esc again to leave.
 */
export function useEscToCoda(): void {
  const router = useRouter();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.value !== "") {
          el.blur();
          return;
        }
      }
      if (el instanceof HTMLElement && el.isContentEditable) {
        if ((el.textContent ?? "") !== "") {
          el.blur();
          return;
        }
      }
      router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}
