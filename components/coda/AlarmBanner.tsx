"use client";

import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";

const SEVEN_DAYS_MS = 7 * 86_400_000;

/**
 * Backup-overdue banner. The ONLY use of `--alarm` on Coda — boxed mono caps.
 * Shows when there are cards AND (lastBackup is null OR > 7 days ago).
 *
 * The button is wired to a TODO export in M10. For now it's a hint.
 */
export function AlarmBanner() {
  const hydrated = useHydrated();
  const lastBackup = useDeckStore((s) => s.lastBackup);
  const cardCount = useDeckStore((s) => s.cards.length);

  if (!hydrated || cardCount === 0) return null;

  const overdue = lastBackup === null || Date.now() - lastBackup > SEVEN_DAYS_MS;
  if (!overdue) return null;

  const daysSince =
    lastBackup === null
      ? null
      : Math.floor((Date.now() - lastBackup) / 86_400_000);

  return (
    <div className="alarm-banner" data-show="true" role="alert">
      <span>
        {daysSince === null
          ? "Backup raccomandato — nessun export ancora."
          : `Backup raccomandato — ultimo export ${daysSince} giorni fa.`}
      </span>
      <button type="button">Esporta</button>
    </div>
  );
}
