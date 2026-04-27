"use client";

const KEYS = ["à", "è", "é", "ì", "ò", "ù"] as const;

type AccentKeysProps = {
  /** Called with the inserted character. The QuizCard appends it to the input and re-focuses. */
  onInsert: (char: string) => void;
};

/**
 * The strip of accented Italian characters above/beside the input. Click inserts.
 * Keyboard focus skips these by default (they're auxiliary) — Tab still moves through.
 */
export function AccentKeys({ onInsert }: AccentKeysProps) {
  return (
    <div className="accent-row" aria-label="Caratteri accentati">
      {KEYS.map((ch) => (
        <button
          key={ch}
          type="button"
          tabIndex={-1}
          className="accent-key"
          onClick={() => onInsert(ch)}
          aria-label={`Inserisci ${ch}`}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
