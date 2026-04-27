"use client";

import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { buildExportEnvelope, exportFilename, triggerDownload } from "@/lib/io/exportJson";

const SEVEN_DAYS_MS = 7 * 86_400_000;

/**
 * Backup-overdue banner. The ONLY use of `--alarm` on Coda — boxed mono caps.
 * Shows when there are cards AND (lastBackup is null OR > 7 days ago).
 * Esporta button triggers a JSON download and stamps lastBackup, clearing the banner.
 */
export function AlarmBanner() {
  const hydrated = useHydrated();
  const lastBackup = useDeckStore((s) => s.lastBackup);
  const cardCount = useDeckStore((s) => s.cards.length);
  const markBackedUp = useDeckStore((s) => s.markBackedUp);

  if (!hydrated || cardCount === 0) return null;

  const overdue = lastBackup === null || Date.now() - lastBackup > SEVEN_DAYS_MS;
  if (!overdue) return null;

  const daysSince =
    lastBackup === null ? null : Math.floor((Date.now() - lastBackup) / 86_400_000);

  function handleExport() {
    const state = useDeckStore.getState();
    const env = buildExportEnvelope({
      cards: state.cards,
      errors: state.errors,
      sessions: state.sessions,
      streakLastDay: state.streakLastDay,
      streakCount: state.streakCount,
      lastBackup: state.lastBackup,
    });
    triggerDownload(env, exportFilename());
    markBackedUp();
  }

  return (
    <div className="alarm-banner" data-show="true" role="alert">
      <span>
        {daysSince === null
          ? "Backup raccomandato — nessun export ancora."
          : `Backup raccomandato — ultimo export ${daysSince} giorni fa.`}
      </span>
      <button type="button" onClick={handleExport}>Esporta</button>
    </div>
  );
}
