"use client";
import { useEffect } from "react";
import { currentWarm } from "@/lib/ambient";

const TEN_MIN_MS = 10 * 60 * 1000;

/**
 * Sets `--warm` on <html> immediately on mount and re-applies every 10 minutes.
 * The CSS rule for `--bg` reads `--warm` to drift the background hue by hour.
 */
export function useAmbientWarmth(): void {
  useEffect(() => {
    function apply() {
      const warm = currentWarm(new Date().getHours());
      document.documentElement.style.setProperty("--warm", String(warm));
    }
    apply();
    const id = window.setInterval(apply, TEN_MIN_MS);
    return () => window.clearInterval(id);
  }, []);
}
