"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { FormEvent } from "react";

export type ContentEditableHandle = {
  /** Read the current text content (trimmed of leading/trailing whitespace). */
  read: () => string;
  /** Read raw text content without trimming. */
  readRaw: () => string;
  /** Replace the zone's content. Use empty string to clear. */
  set: (text: string) => void;
  /** Focus the zone. */
  focus: () => void;
};

type Props = {
  /** Placeholder shown when the zone is empty. */
  placeholder?: string;
  /** ARIA label — required for screen readers since there's no <label> element. */
  ariaLabel: string;
  /** Visual class hook — default `ruled-zone`. */
  className?: string;
  /** Called synchronously with current text whenever the user types. Cheap callbacks only — runs on every keystroke. */
  onInput?: (text: string) => void;
  /** Called when the user presses Enter while NOT holding a modifier (single-line zones only). */
  onEnter?: () => void;
  /** Called when the user presses Cmd/Ctrl+Enter — typically used for "save". */
  onCmdEnter?: () => void;
  /** Allow line breaks (default false — single-line zone, Enter is intercepted). */
  multiline?: boolean;
};

/**
 * Uncontrolled contenteditable zone — the highest-correctness-risk component
 * in this port.
 *
 * Two pitfalls fixed here:
 *   1. NO `dangerouslySetInnerHTML` and NO rendered children. Either causes
 *      React to manage the DOM children, which wipes the user's input on
 *      parent re-renders.
 *   2. `onInput` is called SYNCHRONOUSLY from React's synthetic onInput event,
 *      not via a debounced setTimeout. The setTimeout pattern triggered a
 *      stale-closure bug under StrictMode in dev (the captured setState ran
 *      against an unmounted instance and silently no-op'd). detectCat is
 *      microsecond-fast, so calling on every keystroke costs nothing.
 *
 * Placeholder: rendered via `:empty::before { content: attr(data-placeholder) }`
 * in `globals.css` — no React state, no flicker.
 *
 * Single-line by default: Enter is intercepted (calls onEnter or onCmdEnter
 * with modifier); browsers' default behaviour would insert <br> or <div>.
 */
export const ContentEditableZone = forwardRef<ContentEditableHandle, Props>(
  function ContentEditableZone(
    {
      placeholder,
      ariaLabel,
      className = "ruled-zone",
      onInput,
      onEnter,
      onCmdEnter,
      multiline = false,
    },
    forwardedRef,
  ) {
    const elRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => ({
      read: () => (elRef.current?.textContent ?? "").trim(),
      readRaw: () => elRef.current?.textContent ?? "",
      set: (text: string) => {
        if (elRef.current) elRef.current.textContent = text;
      },
      focus: () => elRef.current?.focus(),
    }), []);

    function handleReactInput(e: FormEvent<HTMLDivElement>) {
      if (!onInput) return;
      const text = (e.currentTarget.textContent ?? "").trim();
      onInput(text);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      // Cmd/Ctrl+Enter ALWAYS fires onCmdEnter (whether multiline or not).
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (onCmdEnter) {
          e.preventDefault();
          onCmdEnter();
        }
        return;
      }
      // Plain Enter in single-line mode: intercept and fire onEnter.
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        onEnter?.();
      }
    }

    // CRITICAL: do NOT render any children, and do NOT pass dangerouslySetInnerHTML.
    // Either of those would cause React to "manage" the contenteditable's children,
    // and on parent re-renders (e.g. after debounced setDetected), React would wipe
    // whatever the user has typed. With no rendered children + suppressContentEditableWarning,
    // React leaves the DOM alone after mount and the contenteditable is uncontrolled.
    return (
      <div
        ref={elRef}
        className={className}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline={multiline}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="none"
        data-placeholder={placeholder}
        onKeyDown={onKeyDown}
        onInput={handleReactInput}
      />
    );
  },
);
