# M10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 of the Studiolo port — wire ambient warmth, global Esc-to-Coda, prefers-color-scheme, real export/import (with preview-and-choose), static export config, hand-rolled PWA layer (manifest + service worker + installable), and the `carattere` font-axis (replacing the dead `voce` row with antica/moderna).

**Architecture:** Mostly wiring. Pure-function logic (`exportJson`, `importJson`) is TDD'd. UI integration verified end-to-end via the dev server (`mcp__Claude_Preview__preview_eval`). PWA is hand-rolled (no `next-pwa` dep) — ~50-line service worker with stale-while-revalidate. Carattere axis works via one CSS-variable swap (`--serif`) that propagates to every existing `var(--serif)` reference.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand v5 with `persist`, Vitest, system fonts only (no webfonts). Project root: `C:\Users\aliza\Downloads\studiolo`.

**Spec:** `docs/superpowers/specs/2026-04-27-m10-design.md`

**Working tree state:** the project isn't yet a git repo. Task 0 initializes it.

---

## Task 0: Initialize git + commit M1–M9 baseline

**Files:**
- Create: `.gitignore`
- All existing project files become the initial commit

- [ ] **Step 1: Verify project root**

Run from any shell:
```bash
ls "/c/Users/aliza/Downloads/studiolo/package.json" 2>/dev/null && echo "OK"
```
Expected: `OK`

- [ ] **Step 2: Write .gitignore**

Create `C:\Users\aliza\Downloads\studiolo\.gitignore`:
```
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem
Thumbs.db

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local
.env

# typescript
*.tsbuildinfo
next-env.d.ts

# vercel
.vercel
```

- [ ] **Step 3: git init + initial commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git init && git add . && git commit -m "chore: initial M1-M9 commit (Studiolo port baseline)"
```
Expected: a commit hash printed; ~150 files committed.

---

## Task 1: `useAmbientWarmth` hook + mount in ClientShell

**Files:**
- Create: `lib/hooks/useAmbientWarmth.ts`
- Modify: `components/shell/ClientShell.tsx`

- [ ] **Step 1: Create the hook**

Create `lib/hooks/useAmbientWarmth.ts`:
```ts
"use client";
import { useEffect } from "react";
import { currentWarm } from "@/lib/ambient";

const TEN_MIN_MS = 10 * 60 * 1000;

/**
 * Mounts on the client, sets `--warm` on <html> immediately and re-applies every
 * 10 minutes from the current hour. The CSS rule for `--bg` (in globals.css) reads
 * `--warm` to drift the cream/charcoal background hue by time of day.
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
```

- [ ] **Step 2: Mount the hook in ClientShell**

In `components/shell/ClientShell.tsx`, add the import and call inside the component:
```ts
import { useAmbientWarmth } from "@/lib/hooks/useAmbientWarmth";
```
Then inside `ClientShell()`, near the other hook calls:
```ts
useAmbientWarmth();
```

- [ ] **Step 3: Verify in the running dev server**

Server is already running on port 3210 via the `studiolo-next` launch entry (memory: ref_studiolo_devserver). If not, `mcp__Claude_Preview__preview_start` it.

Run via `mcp__Claude_Preview__preview_eval`:
```js
(() => {
  const root = document.documentElement;
  const warmBefore = getComputedStyle(root).getPropertyValue('--warm').trim();
  return { warm: warmBefore, hour: new Date().getHours() };
})()
```
Expected: `warm` matches what `currentWarm(hour)` returns for the current local hour. Specifically, hour 9–17 → `0.3`; 18–20 → `0.8`; 21–23 → `-0.4`; 0–5 → `-0.6`; 6–8 → `0.2`.

- [ ] **Step 4: Run unit tests + tsc**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test 2>&1 | tail -5 && npx tsc --noEmit
```
Expected: 116 tests passing, tsc clean.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/hooks/useAmbientWarmth.ts components/shell/ClientShell.tsx && git commit -m "feat(m10): wire ambient warmth interval"
```

---

## Task 2: `useEscToCoda` global hook + remove per-view handlers

**Files:**
- Create: `lib/hooks/useEscToCoda.ts`
- Modify: `components/shell/ClientShell.tsx`
- Modify: `components/studiare/StudiareView.tsx` (remove local handler)
- Modify: `components/dettatura/DettaturaView.tsx` (remove local handler)

- [ ] **Step 1: Create the hook**

Create `lib/hooks/useEscToCoda.ts`:
```ts
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keydown listener: Esc returns the user to Coda (`/`).
 *
 * Smart behavior:
 *   - If focus is in a contenteditable / input / textarea AND the field has content,
 *     blur the field instead of navigating. This lets the user clear their input
 *     with Esc first and then Esc again to leave.
 *   - Otherwise, navigate to `/`.
 *
 * Mounted once in ClientShell. Per-view Esc handlers are now redundant and removed.
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
```

- [ ] **Step 2: Mount the hook in ClientShell**

In `components/shell/ClientShell.tsx`, add import + call:
```ts
import { useEscToCoda } from "@/lib/hooks/useEscToCoda";
```
Then inside `ClientShell()`:
```ts
useEscToCoda();
```

- [ ] **Step 3: Remove the local Esc handler from StudiareView**

In `components/studiare/StudiareView.tsx`, delete the entire `useEffect` block that listens for `Escape` (the one that aborts the session and navigates). Keep the imports clean — `useRouter` is still used elsewhere in the file (for the session-finished button), so leave that import.

- [ ] **Step 4: Remove the local Esc handler from DettaturaView**

In `components/dettatura/DettaturaView.tsx`, delete the `useEffect` block that listens for `Escape`. The `inputRef.current?.set("")` clear-on-Esc behavior is now lost, but the global hook's "blur on non-empty input" handles the equivalent for textareas/inputs. (Contenteditable's `set("")` is a future improvement, out of scope.)

- [ ] **Step 5: Verify Esc behavior across all 5 views**

Via `mcp__Claude_Preview__preview_eval`:
```js
(async () => {
  const results = {};
  for (const path of ['/', '/studiare', '/aggiungi', '/dettatura', '/statistiche']) {
    window.location.href = window.location.origin + path;
    await new Promise(r => setTimeout(r, 800));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    results[path] = window.location.pathname;
  }
  return results;
})()
```
Expected: every value in `results` is `"/"` (Esc returned us to Coda from each view).

- [ ] **Step 6: tsc + tests**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit && npm test 2>&1 | tail -5
```
Expected: tsc clean, 116 tests passing.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/hooks/useEscToCoda.ts components/shell/ClientShell.tsx components/studiare/StudiareView.tsx components/dettatura/DettaturaView.tsx && git commit -m "feat(m10): centralize Esc-to-Coda as a global hook"
```

---

## Task 3: Verify `prefers-color-scheme` listener for Auto theme

This is mostly a verification task — the listener was already wired in M3's `ClientShell.tsx`. We're confirming it actually fires.

**Files:**
- (no changes; verify only)

- [ ] **Step 1: Set theme to Auto via store**

Via `mcp__Claude_Preview__preview_eval`:
```js
(() => {
  const ui = JSON.parse(localStorage.getItem('studiolo.ui.v1'));
  ui.state.theme = 'auto';
  localStorage.setItem('studiolo.ui.v1', JSON.stringify(ui));
  location.reload();
  return 'theme set to auto, reloading';
})()
```

- [ ] **Step 2: Inspect the data-theme that resolved**

After reload, via eval:
```js
(() => ({
  uiTheme: JSON.parse(localStorage.getItem('studiolo.ui.v1')).state.theme,
  htmlDataTheme: document.documentElement.dataset.theme,
  prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
}))()
```
Expected: `uiTheme === 'auto'`, `htmlDataTheme` is `"light"` or `"dark"` matching `prefersDark`.

- [ ] **Step 3: Toggle DevTools emulation**

Open DevTools → ⋮ → More tools → Rendering → "Emulate CSS media feature prefers-color-scheme" → flip between light and dark. The page should change theme live (because of the `mq.addEventListener("change", ...)` listener registered in `ClientShell` line ~45).

- [ ] **Step 4: Reset theme to giorno**

Via eval:
```js
(() => {
  const ui = JSON.parse(localStorage.getItem('studiolo.ui.v1'));
  ui.state.theme = 'giorno';
  localStorage.setItem('studiolo.ui.v1', JSON.stringify(ui));
  location.reload();
  return 'reset';
})()
```

- [ ] **Step 5: Commit (no-op task documentation)**

This step has no code changes; just confirm in a tracking doc:
```bash
cd "/c/Users/aliza/Downloads/studiolo" && git commit --allow-empty -m "docs(m10): verified prefers-color-scheme listener in ClientShell"
```

---

## Task 4: `exportJson.ts` (TDD) — pure logic for building the export envelope

**Files:**
- Create: `lib/io/types.ts`
- Create: `lib/io/exportJson.ts`
- Create: `tests/io/exportJson.test.ts`

- [ ] **Step 1: Write the types**

Create `lib/io/types.ts`:
```ts
import type { Card, ErrorEvent, Session } from "@/lib/srs/types";

/**
 * The persisted deck shape. Subset of DeckState (excludes the `seeded` flag,
 * which is derivable: `seeded = cards.length > 0`).
 */
export type DeckPayload = {
  cards: Card[];
  errors: ErrorEvent[];
  sessions: Session[];
  streakLastDay: string | null;
  streakCount: number;
  lastBackup: number | null;
};

/**
 * The export file format. `version` lets us evolve the schema without breaking
 * older imports.
 */
export type ExportEnvelope = {
  version: 1;
  exportedAt: string; // ISO 8601
  deck: DeckPayload;
};

export type ImportPreview = {
  /** How many cards in the file. */
  cardCount: number;
  /** How many errors. */
  errorCount: number;
  /** ISO date of the file's exportedAt, or null for v0/prototype files. */
  exportedAt: string | null;
  /** The validated, normalized deck payload ready to write into the store. */
  normalized: DeckPayload;
};

export type ValidationOk = { ok: true; preview: ImportPreview };
export type ValidationErr = { ok: false; error: string };
export type ValidationResult = ValidationOk | ValidationErr;
```

- [ ] **Step 2: Write the failing test**

Create `tests/io/exportJson.test.ts`:
```ts
import { describe, test, expect } from "vitest";
import { buildExportEnvelope, exportFilename } from "@/lib/io/exportJson";
import type { DeckPayload } from "@/lib/io/types";

const SAMPLE_DECK: DeckPayload = {
  cards: [],
  errors: [],
  sessions: [],
  streakLastDay: null,
  streakCount: 0,
  lastBackup: null,
};

describe("buildExportEnvelope", () => {
  test("wraps the deck in a v1 envelope with ISO timestamp", () => {
    const env = buildExportEnvelope(SAMPLE_DECK, new Date("2026-04-27T18:32:11.000Z"));
    expect(env.version).toBe(1);
    expect(env.exportedAt).toBe("2026-04-27T18:32:11.000Z");
    expect(env.deck).toBe(SAMPLE_DECK);
  });
});

describe("exportFilename", () => {
  test("formats as studiolo-YYYY-MM-DD.json (zero-padded local date)", () => {
    const d = new Date(2026, 3, 5); // April 5 (month is 0-indexed)
    expect(exportFilename(d)).toBe("studiolo-2026-04-05.json");
  });

  test("December → 12, single-digit day padded", () => {
    const d = new Date(2026, 11, 3);
    expect(exportFilename(d)).toBe("studiolo-2026-12-03.json");
  });
});
```

- [ ] **Step 3: Run the test (should fail)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test -- tests/io/exportJson.test.ts 2>&1 | tail -10
```
Expected: failure — module `@/lib/io/exportJson` not found.

- [ ] **Step 4: Implement the minimal code**

Create `lib/io/exportJson.ts`:
```ts
import type { DeckPayload, ExportEnvelope } from "./types";

/** Build the export envelope. Pure. */
export function buildExportEnvelope(
  deck: DeckPayload,
  now: Date = new Date(),
): ExportEnvelope {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    deck,
  };
}

/** `studiolo-YYYY-MM-DD.json` (local-time, zero-padded date). */
export function exportFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `studiolo-${y}-${m}-${d}.json`;
}

/**
 * Side-effecting download trigger. Intentionally separate from the pure
 * envelope builder so tests don't have to mock the DOM.
 *
 * Usage from a click handler:
 *   const env = buildExportEnvelope(deck);
 *   triggerDownload(env, exportFilename());
 */
export function triggerDownload(env: ExportEnvelope, filename: string): void {
  const blob = new Blob([JSON.stringify(env, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick to let the browser begin the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 5: Run the test (should pass)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test -- tests/io/exportJson.test.ts 2>&1 | tail -8
```
Expected: 3 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/io/types.ts lib/io/exportJson.ts tests/io/exportJson.test.ts && git commit -m "feat(m10): exportJson — TDD'd envelope builder + filename + download trigger"
```

---

## Task 5: `importJson.ts` (TDD) — parse, validate, normalize

**Files:**
- Create: `lib/io/importJson.ts`
- Create: `tests/io/importJson.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/io/importJson.test.ts`:
```ts
import { describe, test, expect } from "vitest";
import { parseImport } from "@/lib/io/importJson";
import type { Card } from "@/lib/srs/types";

const NOW = 1_700_000_000_000;

function mkCard(id: string): Card {
  return {
    id,
    en: id,
    it: id,
    cat: "altro",
    rung: 0,
    due: NOW,
    wrongs: 0,
    reviewed: 0,
    history: [],
    parentId: null,
    isChild: false,
    createdAt: NOW,
  };
}

describe("parseImport — v1 envelope", () => {
  test("accepts a valid v1 envelope", () => {
    const env = {
      version: 1,
      exportedAt: "2026-04-27T18:00:00.000Z",
      deck: {
        cards: [mkCard("a"), mkCard("b")],
        errors: [],
        sessions: [],
        streakLastDay: null,
        streakCount: 0,
        lastBackup: null,
      },
    };
    const result = parseImport(JSON.stringify(env));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.cardCount).toBe(2);
    expect(result.preview.errorCount).toBe(0);
    expect(result.preview.exportedAt).toBe("2026-04-27T18:00:00.000Z");
  });

  test("normalizes missing optional fields (errors/sessions default to [])", () => {
    const env = {
      version: 1,
      exportedAt: "2026-04-27T18:00:00.000Z",
      deck: {
        cards: [mkCard("a")],
        // errors, sessions, streakLastDay, streakCount, lastBackup all missing
      },
    };
    const result = parseImport(JSON.stringify(env));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.normalized.errors).toEqual([]);
    expect(result.preview.normalized.sessions).toEqual([]);
    expect(result.preview.normalized.streakLastDay).toBeNull();
    expect(result.preview.normalized.streakCount).toBe(0);
    expect(result.preview.normalized.lastBackup).toBeNull();
  });
});

describe("parseImport — v0 / prototype shape (no envelope)", () => {
  test("accepts a flat prototype-style export and auto-wraps", () => {
    const flat = {
      cards: [mkCard("a")],
      errors: [],
      sessions: [],
      streakLastDay: "2026-4-26",
      streakCount: 5,
      lastBackup: NOW,
    };
    const result = parseImport(JSON.stringify(flat));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.cardCount).toBe(1);
    expect(result.preview.exportedAt).toBeNull();
    expect(result.preview.normalized.streakCount).toBe(5);
  });
});

describe("parseImport — invalid", () => {
  test("rejects garbage JSON", () => {
    const result = parseImport("not json");
    expect(result.ok).toBe(false);
  });

  test("rejects JSON without cards", () => {
    const result = parseImport(JSON.stringify({ version: 1, deck: {} }));
    expect(result.ok).toBe(false);
  });

  test("rejects JSON where cards is not an array", () => {
    const result = parseImport(JSON.stringify({ cards: "nope" }));
    expect(result.ok).toBe(false);
  });

  test("rejects a card missing required fields", () => {
    const result = parseImport(
      JSON.stringify({ cards: [{ id: "a", en: "x" /* missing it, cat, etc */ }] }),
    );
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test (should fail)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test -- tests/io/importJson.test.ts 2>&1 | tail -10
```
Expected: file not found.

- [ ] **Step 3: Implement**

Create `lib/io/importJson.ts`:
```ts
import type { Card, ErrorEvent, Session } from "@/lib/srs/types";
import type {
  DeckPayload,
  ExportEnvelope,
  ValidationResult,
  ValidationErr,
} from "./types";

const REQUIRED_CARD_FIELDS = [
  "id", "en", "it", "cat", "rung", "due", "wrongs",
  "reviewed", "history", "parentId", "isChild", "createdAt",
] as const;

function err(message: string): ValidationErr {
  return { ok: false, error: message };
}

function validateCard(c: unknown): c is Card {
  if (typeof c !== "object" || c === null) return false;
  for (const field of REQUIRED_CARD_FIELDS) {
    if (!(field in c)) return false;
  }
  return true;
}

function normalizeDeck(raw: Partial<DeckPayload> & { cards: unknown }): DeckPayload | null {
  if (!Array.isArray(raw.cards)) return null;
  if (!raw.cards.every(validateCard)) return null;
  return {
    cards: raw.cards as Card[],
    errors: Array.isArray(raw.errors) ? (raw.errors as ErrorEvent[]) : [],
    sessions: Array.isArray(raw.sessions) ? (raw.sessions as Session[]) : [],
    streakLastDay: typeof raw.streakLastDay === "string" ? raw.streakLastDay : null,
    streakCount: typeof raw.streakCount === "number" ? raw.streakCount : 0,
    lastBackup: typeof raw.lastBackup === "number" ? raw.lastBackup : null,
  };
}

/**
 * Parse and validate the contents of an import file.
 *
 * Accepts two shapes:
 *   - v1 envelope: `{ version: 1, exportedAt, deck: {...} }` — what we write
 *   - v0 / prototype: flat `{ cards, errors, ... }` — what the original
 *     postilla.html prototype wrote
 *
 * Returns `{ ok: true, preview }` on success; `{ ok: false, error }` otherwise.
 */
export function parseImport(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("File non riconosciuto · JSON non valido.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return err("File non riconosciuto · oggetto JSON atteso.");
  }

  // Detect shape.
  let deckRaw: unknown;
  let exportedAt: string | null;
  if ("deck" in parsed && typeof (parsed as { deck: unknown }).deck === "object") {
    // v1 envelope
    const env = parsed as Partial<ExportEnvelope>;
    deckRaw = env.deck;
    exportedAt = typeof env.exportedAt === "string" ? env.exportedAt : null;
  } else {
    // v0 flat
    deckRaw = parsed;
    exportedAt = null;
  }

  if (typeof deckRaw !== "object" || deckRaw === null) {
    return err("File non riconosciuto · sezione `deck` mancante.");
  }
  if (!("cards" in deckRaw)) {
    return err("File non riconosciuto · campo `cards` mancante.");
  }

  const normalized = normalizeDeck(deckRaw as Partial<DeckPayload> & { cards: unknown });
  if (!normalized) {
    return err("File non riconosciuto · una o più carte non valide.");
  }

  return {
    ok: true,
    preview: {
      cardCount: normalized.cards.length,
      errorCount: normalized.errors.length,
      exportedAt,
      normalized,
    },
  };
}
```

- [ ] **Step 4: Run the test**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test -- tests/io/importJson.test.ts 2>&1 | tail -8
```
Expected: all tests passing.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/io/importJson.ts tests/io/importJson.test.ts && git commit -m "feat(m10): importJson — TDD'd parse + validate + v0/v1 shape detection"
```

---

## Task 6: Add `importState` and `mergeState` actions to deck store

**Files:**
- Modify: `lib/store/deck.ts`
- Modify: `tests/store/deck.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/store/deck.test.ts`:
```ts
import type { DeckPayload } from "@/lib/io/types";

describe("deck store · importState", () => {
  test("replaces all current state with the imported deck", () => {
    const id1 = useDeckStore.getState().addCard({ en: "x", it: "x", cat: "altro" });
    expect(useDeckStore.getState().cards).toHaveLength(1);

    const incoming: DeckPayload = {
      cards: [{
        id: "imported", en: "the cat", it: "il gatto", cat: "sostantivo",
        rung: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
        parentId: null, isChild: false, createdAt: 0,
      }],
      errors: [],
      sessions: [],
      streakLastDay: null,
      streakCount: 0,
      lastBackup: null,
    };
    useDeckStore.getState().importState(incoming);

    const cards = useDeckStore.getState().cards;
    expect(cards).toHaveLength(1);
    expect(cards[0]?.id).toBe("imported");
    expect(cards.find((c) => c.id === id1)).toBeUndefined();
  });
});

describe("deck store · mergeState", () => {
  test("dedupe cards by id (existing wins on collision)", () => {
    useDeckStore.getState().addCard({ en: "x", it: "x", cat: "altro" });
    const localId = useDeckStore.getState().cards[0]?.id;
    expect(localId).toBeDefined();

    const incoming: DeckPayload = {
      cards: [
        // collision — should NOT overwrite local
        {
          id: localId!, en: "OVERWRITE", it: "x", cat: "altro",
          rung: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
          parentId: null, isChild: false, createdAt: 0,
        },
        // unique — should be added
        {
          id: "unique", en: "y", it: "y", cat: "altro",
          rung: 0, due: 0, wrongs: 0, reviewed: 0, history: [],
          parentId: null, isChild: false, createdAt: 0,
        },
      ],
      errors: [],
      sessions: [],
      streakLastDay: null,
      streakCount: 0,
      lastBackup: null,
    };
    useDeckStore.getState().mergeState(incoming);

    const cards = useDeckStore.getState().cards;
    expect(cards).toHaveLength(2);
    expect(cards.find((c) => c.id === localId)?.en).toBe("x"); // not OVERWRITE
    expect(cards.find((c) => c.id === "unique")).toBeDefined();
  });

  test("appends incoming errors chronologically (sorted by when)", () => {
    const incoming: DeckPayload = {
      cards: [],
      errors: [
        { cardId: "x", when: 3000, wrong: "c", correct: "x", ctx: "traduzione" },
        { cardId: "x", when: 1000, wrong: "a", correct: "x", ctx: "traduzione" },
        { cardId: "x", when: 2000, wrong: "b", correct: "x", ctx: "traduzione" },
      ],
      sessions: [],
      streakLastDay: null,
      streakCount: 0,
      lastBackup: null,
    };
    useDeckStore.getState().mergeState(incoming);

    const errors = useDeckStore.getState().errors;
    expect(errors.map((e) => e.wrong)).toEqual(["a", "b", "c"]);
  });

  test("keeps MAX(local, imported) for streakCount", () => {
    useDeckStore.setState({ streakCount: 5 });
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 12, lastBackup: null,
    });
    expect(useDeckStore.getState().streakCount).toBe(12);

    useDeckStore.setState({ streakCount: 20 });
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 3, lastBackup: null,
    });
    expect(useDeckStore.getState().streakCount).toBe(20);
  });

  test("stamps lastBackup = Date.now() after merge", () => {
    const before = Date.now();
    useDeckStore.getState().mergeState({
      cards: [], errors: [], sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    });
    const after = Date.now();
    const lastBackup = useDeckStore.getState().lastBackup;
    expect(lastBackup).not.toBeNull();
    expect(lastBackup!).toBeGreaterThanOrEqual(before);
    expect(lastBackup!).toBeLessThanOrEqual(after);
  });
});
```

- [ ] **Step 2: Run the test (should fail)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test -- tests/store/deck.test.ts 2>&1 | tail -8
```
Expected: failures — `importState` / `mergeState` not defined.

- [ ] **Step 3: Implement the actions**

In `lib/store/deck.ts`:
- Add `import type { DeckPayload } from "@/lib/io/types";` near the top
- In the `DeckActions` type, add:
```ts
  /** Replace the entire deck state with the given payload. Used by Importa → Sostituisci. */
  importState: (payload: DeckPayload) => void;
  /** Merge the given payload into current state (dedupe cards by id, append/sort errors, MAX streak). Used by Importa → Aggiungi. */
  mergeState: (payload: DeckPayload) => void;
```
- Inside the `create()` body, add the action implementations near the other actions:
```ts
      importState: (payload) =>
        set({
          cards: payload.cards,
          errors: payload.errors,
          sessions: payload.sessions,
          streakLastDay: payload.streakLastDay,
          streakCount: payload.streakCount,
          lastBackup: payload.lastBackup,
          seeded: payload.cards.length > 0,
        }),

      mergeState: (payload) =>
        set((s) => {
          const existingIds = new Set(s.cards.map((c) => c.id));
          const newCards = payload.cards.filter((c) => !existingIds.has(c.id));
          const mergedErrors = [...s.errors, ...payload.errors].sort(
            (a, b) => a.when - b.when,
          );
          return {
            cards: [...s.cards, ...newCards],
            errors: mergedErrors,
            sessions: [...s.sessions, ...payload.sessions],
            streakCount: Math.max(s.streakCount, payload.streakCount),
            // streakLastDay: keep local — merging streak day strings is meaningless
            lastBackup: Date.now(),
            seeded: true,
          };
        }),
```

- [ ] **Step 4: Run the test (should pass)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm test 2>&1 | tail -5
```
Expected: 116 + 5 = 121 (or similar) tests passing.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/store/deck.ts tests/store/deck.test.ts && git commit -m "feat(m10): deck store — importState (replace) and mergeState (dedupe + append)"
```

---

## Task 7: `BackupGroup` component (Esporta + Importa, Aspetto panel section)

**Files:**
- Create: `components/shell/BackupGroup.tsx`
- Modify: `components/shell/TweaksPanel.tsx`
- Modify: `app/globals.css` (add modal-related styles in Task 8 — for now just the BackupGroup buttons)

- [ ] **Step 1: Create the BackupGroup component**

Create `components/shell/BackupGroup.tsx`:
```tsx
"use client";

import { useRef, useState } from "react";
import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { buildExportEnvelope, exportFilename, triggerDownload } from "@/lib/io/exportJson";
import { parseImport } from "@/lib/io/importJson";
import type { ImportPreview } from "@/lib/io/types";
import { ImportPreviewModal } from "./ImportPreviewModal";

const FEEDBACK_FADE_MS = 1800;

/**
 * The 5th section in the Aspetto panel. Two primary buttons (Esporta, Importa)
 * + transient Italian feedback string. The InstallPrompt slot adds a 3rd
 * button when the browser fires `beforeinstallprompt` (Task 14).
 */
export function BackupGroup() {
  const hydrated = useHydrated();
  const cardCount = useDeckStore((s) => s.cards.length);
  const markBackedUp = useDeckStore((s) => s.markBackedUp);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);

  const [feedback, setFeedback] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  function flash(text: string, tone: "ok" | "error" = "ok") {
    setFeedback({ text, tone });
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), FEEDBACK_FADE_MS);
  }

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
    flash(`esportato · ${state.cards.length} ${state.cards.length === 1 ? "carta" : "carte"}`);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-picked
    if (!file) return;
    const text = await file.text();
    const result = parseImport(text);
    if (!result.ok) {
      flash(result.error, "error");
      return;
    }
    setPreview(result.preview);
  }

  return (
    <section className="tweak-group">
      <div className="tweak-label">backup</div>
      <div className="backup-actions">
        <button type="button" className="backup-btn" onClick={handleExport} disabled={!hydrated}>
          ↓ esporta
        </button>
        <button type="button" className="backup-btn" onClick={handleImportClick}>
          ↑ importa
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-hidden
        />
      </div>
      {feedback && (
        <p className={`backup-feedback ${feedback.tone}`}>{feedback.text}</p>
      )}
      {preview && (
        <ImportPreviewModal
          preview={preview}
          onClose={(action) => {
            if (action === "replace") flash(`importato · ${preview.cardCount} carte (sostituite)`);
            else if (action === "merge") flash(`importato · ${preview.cardCount} carte (aggiunte)`);
            setPreview(null);
          }}
        />
      )}
      {/* Install button slot — populated by InstallPrompt in Task 14. */}
      <div id="install-prompt-slot" />
      <p className="backup-hint">
        carte attuali: <span className="v">{hydrated ? cardCount : "—"}</span>
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Add minimal placeholder for ImportPreviewModal**

So Task 7 builds without Task 8 finished, create a stub at `components/shell/ImportPreviewModal.tsx`:
```tsx
"use client";

import type { ImportPreview } from "@/lib/io/types";

type Props = {
  preview: ImportPreview;
  onClose: (action: "replace" | "merge" | "cancel") => void;
};

/** Stub — full implementation in Task 8. */
export function ImportPreviewModal({ onClose }: Props) {
  return null;
}
```
(Task 8 will replace this with the real modal.)

- [ ] **Step 3: Wire BackupGroup into TweaksPanel**

In `components/shell/TweaksPanel.tsx`:
- Add import: `import { BackupGroup } from "./BackupGroup";`
- Inside the `<aside id="tweaks-panel" ...>`, after the `errata` section, add: `<BackupGroup />`

- [ ] **Step 4: Add styles for BackupGroup**

Append to `app/globals.css` inside the SHELL block (where the `.tweak-group` rule lives):
```css
.backup-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.backup-btn {
  flex: 1 1 auto;
  background: transparent; border: 0.5px solid var(--hair);
  color: var(--fg); cursor: pointer;
  font: 11px/1 var(--mono);
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 10px 14px;
  transition: border-color 160ms ease, background 160ms ease;
}
.backup-btn:hover { border-color: var(--fg); background: color-mix(in srgb, var(--accent) 6%, transparent); }
.backup-btn:disabled { opacity: 0.5; cursor: default; }
.backup-feedback {
  font: italic 13px/1.4 var(--serif);
  color: var(--accent); margin: 8px 0 0;
}
.backup-feedback.error { color: var(--alarm); }
.backup-hint {
  font: 10px/1 var(--mono);
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--muted);
  margin: 12px 0 0;
}
.backup-hint .v { color: var(--fg); font-feature-settings: "tnum"; }
```

- [ ] **Step 5: Verify in browser**

Via `mcp__Claude_Preview__preview_eval`:
```js
(() => {
  // Open Aspetto, look for the new backup section
  document.querySelector('.tweaks-toggle')?.click();
  return {
    groups: Array.from(document.querySelectorAll('.tweak-group .tweak-label')).map(l => l.textContent),
    backupBtns: Array.from(document.querySelectorAll('.backup-btn')).map(b => b.textContent.trim()),
  };
})()
```
Expected: `groups` includes `'backup'` after `'errata'`. `backupBtns` is `["↓ esporta", "↑ importa"]`.

- [ ] **Step 6: Click Esporta and verify download fires**

Manually click `↓ esporta` in the panel. A file `studiolo-YYYY-MM-DD.json` should download. After click, the AlarmBanner on Coda should disappear (because `lastBackup` is now set; AlarmBanner only shows when `lastBackup` is null or > 7 days old).

- [ ] **Step 7: tsc + tests**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit && npm test 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add components/shell/BackupGroup.tsx components/shell/ImportPreviewModal.tsx components/shell/TweaksPanel.tsx app/globals.css && git commit -m "feat(m10): BackupGroup in Aspetto with Esporta wiring (Importa modal stub)"
```

---

## Task 8: `ImportPreviewModal` component (preview + Sostituisci/Aggiungi/Annulla)

**Files:**
- Modify: `components/shell/ImportPreviewModal.tsx` (full implementation)
- Modify: `app/globals.css` (modal styles)

- [ ] **Step 1: Implement the modal**

Replace `components/shell/ImportPreviewModal.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import type { ImportPreview } from "@/lib/io/types";
import { useDeckStore } from "@/lib/store/deck";

type Props = {
  preview: ImportPreview;
  onClose: (action: "replace" | "merge" | "cancel") => void;
};

const MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

function formatExportedAt(iso: string | null): string {
  if (!iso) return "(nessuna data — file prototype)";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

export function ImportPreviewModal({ preview, onClose }: Props) {
  const importState = useDeckStore((s) => s.importState);
  const mergeState = useDeckStore((s) => s.mergeState);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the dialog on open; trap ESC to cancel.
  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose("cancel");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleReplace() {
    importState(preview.normalized);
    onClose("replace");
  }
  function handleMerge() {
    mergeState(preview.normalized);
    onClose("merge");
  }
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose("cancel");
  }

  return (
    <div
      className="modal-bg"
      data-open="true"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-preview-title"
        tabIndex={-1}
      >
        <h2 id="import-preview-title" className="modal-title">
          <em>Importa</em> · trovate
        </h2>
        <p className="modal-summary">
          <span className="v">{preview.cardCount}</span>{" "}
          {preview.cardCount === 1 ? "carta" : "carte"}, <span className="v">{preview.errorCount}</span>{" "}
          {preview.errorCount === 1 ? "errore" : "errori"}.
          <br />
          Ultima esportazione:{" "}
          <em>{formatExportedAt(preview.exportedAt)}</em>.
        </p>
        <p className="modal-question">Cosa fare?</p>
        <div className="modal-actions">
          <button type="button" className="avanti-btn" onClick={handleReplace}>
            Sostituisci
          </button>
          <button type="button" className="avanti-btn" onClick={handleMerge}>
            Aggiungi
          </button>
          <button type="button" className="avanti-btn ghost" onClick={() => onClose("cancel")}>
            Annulla
          </button>
        </div>
        <p className="modal-hint">
          <em>Sostituisci</em> azzera lo stato attuale e usa solo questo file.{" "}
          <em>Aggiungi</em> tiene tutto e mescola.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add modal styles**

Append to `app/globals.css` at end of file:
```css
/* ─── modal (M10) ─── */
.modal-bg {
  position: fixed; inset: 0; z-index: 100;
  background: color-mix(in srgb, var(--charcoal) 60%, transparent);
  display: none;
  align-items: flex-start; justify-content: center;
  padding: 80px 24px;
  animation: fadein 200ms ease;
}
.modal-bg[data-open="true"] { display: flex; }
.modal {
  background: var(--bg);
  border: 0.5px solid var(--fg);
  max-width: 520px; width: 100%;
  padding: 36px 40px;
}
.modal-title {
  font: italic 600 26px/1 var(--serif);
  color: var(--fg);
  margin: 0 0 18px;
}
.modal-title em {
  font-family: var(--serif);
  margin-right: 6px;
}
.modal-summary {
  font: 17px/1.6 var(--serif);
  color: var(--fg);
  margin: 0 0 16px;
}
.modal-summary .v {
  font-weight: 600;
  font-feature-settings: "tnum";
}
.modal-summary em {
  font-style: italic;
  color: var(--muted);
}
.modal-question {
  font: 10px/1 var(--mono);
  letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--muted);
  margin: 24px 0 12px;
}
.modal-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin: 0 0 16px;
}
.modal-actions .avanti-btn { margin-top: 0; }
.modal-hint {
  font: italic 13px/1.5 var(--serif);
  color: var(--muted);
  margin: 0;
}
.modal-hint em { color: var(--fg); font-style: italic; font-weight: 500; }
@keyframes fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .modal-bg { animation: none; }
}
```

- [ ] **Step 3: Verify the import flow end-to-end**

Use the file you just exported (Task 7 step 6) — say `studiolo-2026-04-27.json` in your Downloads.

Manual:
1. Open Aspetto → click `↑ importa`
2. File picker → pick the JSON
3. Modal appears: "Importa · trovate N carte, M errori. Ultima esportazione: 27 aprile 2026."
4. Three buttons: Sostituisci · Aggiungi · Annulla
5. Click Annulla → modal closes, no state change.
6. Re-open, click Aggiungi → state merges, feedback shows, modal closes.
7. Re-open, click Sostituisci → state replaces, feedback shows.

Programmatic verification via eval:
```js
(async () => {
  // Synthesize a small import file
  const sample = {
    version: 1,
    exportedAt: '2026-04-26T10:00:00.000Z',
    deck: {
      cards: [{
        id: 'imported-test', en: 'the lake', it: 'il lago', cat: 'sostantivo',
        rung: 0, due: Date.now(), wrongs: 0, reviewed: 0, history: [],
        parentId: null, isChild: false, createdAt: Date.now(),
      }],
      errors: [], sessions: [],
      streakLastDay: null, streakCount: 0, lastBackup: null,
    },
  };
  const file = new File([JSON.stringify(sample)], 'sample.json', { type: 'application/json' });
  // Open panel, find file input
  document.querySelector('.tweaks-toggle')?.click();
  await new Promise(r => setTimeout(r, 100));
  const input = document.querySelector('input[type="file"]');
  // We can't programmatically set file input value in eval (security),
  // so just inspect that the input + buttons exist:
  return {
    fileInputExists: input !== null,
    accept: input?.accept,
    backupBtns: Array.from(document.querySelectorAll('.backup-btn')).map(b => b.textContent.trim()),
  };
})()
```
Expected: `fileInputExists: true`, `accept: ".json,application/json"`.

For full file-picker testing, do it manually in the browser.

- [ ] **Step 4: tsc + tests**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit && npm test 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add components/shell/ImportPreviewModal.tsx app/globals.css && git commit -m "feat(m10): ImportPreviewModal — preview + Sostituisci/Aggiungi/Annulla flow"
```

---

## Task 9: Wire `AlarmBanner` Esporta button to the same export handler

**Files:**
- Modify: `components/coda/AlarmBanner.tsx`

- [ ] **Step 1: Extract a shared export helper (optional refactor)**

Inside `components/shell/BackupGroup.tsx`, the `handleExport` function is the single source of truth. We could extract it to a hook (`useExport`) but for one consumer (AlarmBanner) inlining is fine — duplication is acceptable when the duplicate is 8 lines and this avoids creating a new hook for one site.

Choice: inline duplication.

- [ ] **Step 2: Wire the button**

Replace the body of `components/coda/AlarmBanner.tsx`'s exported component:
```tsx
"use client";

import { useDeckStore } from "@/lib/store/deck";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { buildExportEnvelope, exportFilename, triggerDownload } from "@/lib/io/exportJson";

const SEVEN_DAYS_MS = 7 * 86_400_000;

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
```

- [ ] **Step 3: Verify**

In the browser: clear `lastBackup` (Aspetto won't show banner if recent — for this test, set it to null):
```js
(() => {
  const deck = JSON.parse(localStorage.getItem('postilla.state.v1'));
  deck.state.lastBackup = null;
  localStorage.setItem('postilla.state.v1', JSON.stringify(deck));
  location.href = '/';
  return 'cleared';
})()
```
Then click the banner's `Esporta` button on Coda — file should download, banner should disappear.

- [ ] **Step 4: tsc + tests + commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit && npm test 2>&1 | tail -5 && git add components/coda/AlarmBanner.tsx && git commit -m "feat(m10): AlarmBanner Esporta button now downloads + clears the banner"
```

---

## Task 10: Add `output: 'export'` static export config

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update next.config.ts**

Replace the contents of `next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Build and verify out/ is produced**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm run build 2>&1 | tail -20
```
Expected: build succeeds; messages mention "Exporting (n/n)" and a final "✓ Generating static pages". An `out/` directory exists.

- [ ] **Step 3: Serve out/ over HTTP and verify**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx -y serve out -l 3211 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3211/
```
Expected: `200`. Then open `http://localhost:3211/` in a browser — it should look like the dev server.

- [ ] **Step 4: Stop the static server**

```bash
pkill -f "serve out" 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add next.config.ts && git commit -m "feat(m10): static export — output: 'export'"
```

---

## Task 11: Web manifest (`app/manifest.ts`)

**Files:**
- Create: `app/manifest.ts`
- Modify: `app/layout.tsx` (add `manifest` to metadata)

- [ ] **Step 1: Create the manifest**

Create `app/manifest.ts`:
```ts
import type { MetadataRoute } from "next";

/**
 * PWA manifest. Next 16 serves this as `/manifest.webmanifest` automatically.
 * Theme color = --accent navy. Background = --cream. Italian-first.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "studiolo · italian SRS",
    short_name: "studiolo",
    description: "Un'edizione critica del tuo italiano",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#1a3050",
    orientation: "portrait",
    lang: "it",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

- [ ] **Step 2: Wire into layout metadata**

In `app/layout.tsx`, add to the `metadata` export:
```ts
export const metadata: Metadata = {
  title: "studiolo.",
  description: "Un'edizione critica del tuo italiano",
  manifest: "/manifest.webmanifest",
  themeColor: "#1a3050",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "studiolo",
  },
};
```

- [ ] **Step 3: Verify the manifest is served**

In dev:
```js
fetch('/manifest.webmanifest').then(r => r.json()).then(console.log)
```
Expected console output: the manifest object with `name`, `short_name`, `icons`, etc.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add app/manifest.ts app/layout.tsx && git commit -m "feat(m10): PWA manifest"
```

---

## Task 12: Generate icon PNGs from a typographic SVG

**Files:**
- Create: `public/favicon.svg`
- Create: `scripts/build-icons.mjs`
- Create: `public/icon-192.png` (generated)
- Create: `public/icon-512.png` (generated)
- Create: `public/icon-maskable.png` (generated)
- Modify: `package.json` (add `prebuild` script + `sharp` devDep)

- [ ] **Step 1: Write the source SVG**

Create `public/favicon.svg`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f5f1e8"/>
  <text
    x="256" y="332"
    font-family="'Iowan Old Style','Charter','Palatino Linotype','Book Antiqua',Palatino,Georgia,serif"
    font-style="italic"
    font-weight="500"
    font-size="280"
    fill="#1a1612"
    text-anchor="middle"
    letter-spacing="-4"
  >s<tspan fill="#8b2920" font-style="normal">.</tspan></text>
</svg>
```

- [ ] **Step 2: Install sharp**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm install -D sharp
```

- [ ] **Step 3: Write the build script**

Create `scripts/build-icons.mjs`:
```js
#!/usr/bin/env node
/**
 * Generate PNG icons from public/favicon.svg.
 * Renders three sizes:
 *   192×192 — Android "any"
 *   512×512 — Android / desktop "any"
 *   512×512 maskable — Android adaptive (with 10% safe-zone padding)
 *
 * Maskable icons need 10% inner padding so launcher masks don't crop the glyph.
 * We render the SVG into a 410×410 inner area, centered on a 512×512 canvas.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "favicon.svg");
const OUT = join(ROOT, "public");

const svg = readFileSync(SRC);

async function render(size, outPath) {
  await sharp(svg, { density: 320 })
    .resize(size, size, { fit: "contain", background: { r: 245, g: 241, b: 232, alpha: 1 } })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

async function renderMaskable(size, outPath) {
  const inner = Math.round(size * 0.8);
  const padding = Math.round((size - inner) / 2);
  await sharp(svg, { density: 320 })
    .resize(inner, inner, { fit: "contain", background: { r: 245, g: 241, b: 232, alpha: 0 } })
    .extend({
      top: padding, bottom: padding, left: padding, right: padding,
      background: { r: 245, g: 241, b: 232, alpha: 1 },
    })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size} maskable, 10% safe zone)`);
}

await render(192, join(OUT, "icon-192.png"));
await render(512, join(OUT, "icon-512.png"));
await renderMaskable(512, join(OUT, "icon-maskable.png"));
```

- [ ] **Step 4: Add prebuild script to package.json**

In `package.json`, add to the `scripts` block:
```json
"prebuild": "node scripts/build-icons.mjs",
"icons": "node scripts/build-icons.mjs"
```

- [ ] **Step 5: Run the icon build**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm run icons
```
Expected: 3 PNGs printed; files exist at `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png`.

- [ ] **Step 6: Verify images render correctly**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && file public/icon-192.png public/icon-512.png public/icon-maskable.png
```
Expected: each line says "PNG image data, [size] x [size]".

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add public/favicon.svg public/icon-192.png public/icon-512.png public/icon-maskable.png scripts/build-icons.mjs package.json package-lock.json && git commit -m "feat(m10): typographic PWA icons (s. wordmark) + sharp build script"
```

---

## Task 13: Service worker (`public/sw.js`)

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write the service worker**

Create `public/sw.js`:
```js
// Studiolo service worker — hand-rolled, stale-while-revalidate.
// Caches the app shell; serves from cache; updates in background.

const CACHE = "studiolo-v1";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Same-origin only — don't try to cache cross-origin (none in our app, but defensive).
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached); // offline fallback

      // Stale-while-revalidate: serve cached now, refresh in background.
      return cached ?? networkFetch;
    }),
  );
});
```

- [ ] **Step 2: Commit (no registration yet — Task 14)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add public/sw.js && git commit -m "feat(m10): hand-rolled service worker (stale-while-revalidate)"
```

---

## Task 14: Register SW in ClientShell + InstallPrompt component

**Files:**
- Create: `components/shell/InstallPrompt.tsx`
- Modify: `components/shell/ClientShell.tsx`
- Modify: `components/shell/BackupGroup.tsx` (consume install prompt)

- [ ] **Step 1: Create InstallPrompt**

Create `components/shell/InstallPrompt.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Browser-fired event for installable PWAs. Not in the standard React types.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let stashedPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    stashedPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    stashedPrompt = null;
    notify();
  });
}

/**
 * Hook returning the install handler when the browser has fired
 * `beforeinstallprompt`, or `null` when no prompt is available (Safari, already
 * installed, etc.). Components can render an `Installa app` button only when
 * a handler is present.
 */
export function useInstallPrompt(): null | (() => Promise<void>) {
  const [available, setAvailable] = useState<boolean>(stashedPrompt !== null);
  useEffect(() => {
    const sub = () => setAvailable(stashedPrompt !== null);
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  if (!available || !stashedPrompt) return null;
  return async () => {
    if (!stashedPrompt) return;
    await stashedPrompt.prompt();
    await stashedPrompt.userChoice;
    stashedPrompt = null;
    notify();
  };
}
```

- [ ] **Step 2: Register the SW in ClientShell**

In `components/shell/ClientShell.tsx`, add a `useEffect` to register the SW (production-only):
```ts
  // Register the service worker in production. Skipping in dev avoids
  // stale-bundle headaches when the bundler regenerates assets.
  useEffect(() => {
    if (!hydrated) return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[sw] registration failed", err));
  }, [hydrated]);
```

- [ ] **Step 3: Wire InstallPrompt into BackupGroup**

In `components/shell/BackupGroup.tsx`:
- Add import: `import { useInstallPrompt } from "./InstallPrompt";`
- At the top of the component, add: `const installHandler = useInstallPrompt();`
- Replace the `<div id="install-prompt-slot" />` line with:
```tsx
        {installHandler && (
          <button type="button" className="backup-btn install-btn" onClick={() => installHandler()}>
            ↗ installa app
          </button>
        )}
```

- [ ] **Step 4: Build + serve + verify SW registers**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm run build 2>&1 | tail -10
```
Then:
```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx -y serve out -l 3211 &
sleep 2
echo "open http://localhost:3211/ and check DevTools → Application → Service Workers"
```

In Chrome DevTools, open `http://localhost:3211/`, then:
- DevTools → Application → Service Workers — should show "studiolo-v1" registered, status "activated and is running"
- Application → Cache Storage → studiolo-v1 — should contain `/`, `/manifest.webmanifest`, `/favicon.svg`, etc.
- Network tab → check "Offline" → reload — page still loads (served from cache)

Stop the static server:
```bash
pkill -f "serve out" 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add components/shell/InstallPrompt.tsx components/shell/ClientShell.tsx components/shell/BackupGroup.tsx && git commit -m "feat(m10): register SW in production + InstallPrompt with Aspetto button"
```

---

## Task 15: Carattere axis (replace `voce` with antica/moderna font picker)

This is the §7 work — purely cosmetic but architecturally clean. Single CSS-variable swap, store rename, layout attribute rename, Aspetto chip-row rename + values.

**Files:**
- Modify: `lib/store/ui.ts` (rename type/field/action, bump persist version)
- Modify: `app/layout.tsx` (`data-voice` → `data-carattere`)
- Modify: `components/shell/ClientShell.tsx` (sync the new attr)
- Modify: `components/shell/TweaksPanel.tsx` (rename section + values)
- Modify: `app/globals.css` (add `--serif-antica`/`--serif-moderna`/swap rule)
- Delete: `components/shell/ThemeToggle.tsx` (unused since M5h)

- [ ] **Step 1: Rename UIStore types and field**

In `lib/store/ui.ts`:
- Replace `export type Voice = "tipografo" | "manoscritto";` with:
```ts
export type Carattere = "antica" | "moderna";
```
- In `UIState`, replace `voice: Voice;` with `carattere: Carattere;`
- In `UIActions`, replace `setVoice: (v: Voice) => void;` with `setCarattere: (c: Carattere) => void;`
- In `initialUIState`, replace `voice: "manoscritto",` with `carattere: "antica",`
- In the `create()` body, replace `setVoice: (voice) => set({ voice }),` with `setCarattere: (carattere) => set({ carattere }),`
- In `persist({...})`, bump version: `version: 2,` and add a migrate function:
```ts
      migrate: (persisted: unknown, fromVersion: number) => {
        // v1 had `voice: 'tipografo'|'manoscritto'`; drop and seed default carattere.
        if (fromVersion < 2 && typeof persisted === "object" && persisted !== null) {
          const p = persisted as Record<string, unknown>;
          delete p.voice;
          if (typeof p.carattere !== "string") p.carattere = "antica";
        }
        return persisted as UIState;
      },
```
- In `partialize`, replace `voice: s.voice,` with `carattere: s.carattere,`

Also: change the `name:` from `"studiolo.ui.v1"` to `"studiolo.ui.v1"` (KEEP THE NAME — Zustand `migrate` runs against the same key when `version` changes; renaming the key would break migration).

- [ ] **Step 2: Update layout default attribute**

In `app/layout.tsx`, change the `<html>` opening tag from:
```tsx
<html lang="it" data-theme="light" data-voice="manoscritto" data-severita="sobrio" data-errata="lezione">
```
to:
```tsx
<html lang="it" data-theme="light" data-carattere="antica" data-severita="sobrio" data-errata="lezione">
```

- [ ] **Step 3: Update ClientShell sync**

In `components/shell/ClientShell.tsx`:
- Replace `const voice = useUIStore((s) => s.voice);` with `const carattere = useUIStore((s) => s.carattere);`
- In the data-attr-sync `useEffect`, replace `root.dataset.voice = voice;` with `root.dataset.carattere = carattere;`
- Update the deps array: replace `voice` with `carattere`

- [ ] **Step 4: Update TweaksPanel**

In `components/shell/TweaksPanel.tsx`:
- Replace import `import { ..., type Voice, ... }` with `import { ..., type Carattere, ... }`
- Replace `const VOICES = [...]` with:
```ts
const CARATTERI: ReadonlyArray<{ v: Carattere; label: string }> = [
  { v: "antica", label: "antica" },
  { v: "moderna", label: "moderna" },
];
```
- Replace state reads `voice`/`setVoice` with `carattere`/`setCarattere`
- Replace the JSX section:
```tsx
<section className="tweak-group">
  <div className="tweak-label">voce</div>
  <ChipRow>
    {VOICES.map(...)}
  </ChipRow>
</section>
```
with:
```tsx
<section className="tweak-group">
  <div className="tweak-label">carattere</div>
  <ChipRow>
    {CARATTERI.map((o) => (
      <Chip
        key={o.v}
        active={hydrated && carattere === o.v}
        onClick={() => setCarattere(o.v)}
      >
        {o.label}
      </Chip>
    ))}
  </ChipRow>
</section>
```

- [ ] **Step 5: Update CSS — define the two font sets and the swap**

In `app/globals.css`, replace the `--serif:` line in `:root` with:
```css
  --serif-antica:  'Iowan Old Style', 'Charter', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, 'Times New Roman', serif;
  --serif-moderna: 'Bodoni 72', 'Bodoni Linotype', 'Big Caslon', Cambria, Constantia, Georgia, 'Times New Roman', serif;
  --serif:         var(--serif-antica);
```
Then somewhere after `:root { ... }` (and before `[data-theme="dark"]` is fine):
```css
html[data-carattere="moderna"] {
  --serif: var(--serif-moderna);
}
```

- [ ] **Step 6: Delete the unused ThemeToggle**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && rm components/shell/ThemeToggle.tsx
```

- [ ] **Step 7: tsc + tests**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit 2>&1 | head -10 && npm test 2>&1 | tail -5
```
Expected: tsc clean, all tests passing.

- [ ] **Step 8: Verify in the browser**

Reload, then:
```js
(() => {
  // Open Aspetto, find the carattere chip row
  document.querySelector('.tweaks-toggle')?.click();
  return {
    groups: Array.from(document.querySelectorAll('.tweak-group .tweak-label')).map(l => l.textContent),
    chipsPerGroup: Array.from(document.querySelectorAll('.tweak-group')).map(g =>
      Array.from(g.querySelectorAll('.chip')).map(c => c.textContent.trim())
    ),
    htmlCarattere: document.documentElement.dataset.carattere,
    serifNow: getComputedStyle(document.documentElement).getPropertyValue('--serif').trim().slice(0, 40),
  };
})()
```
Expected:
- `groups` includes `'carattere'` (and NOT `'voce'`)
- One of the rows is `["antica", "moderna"]`
- `htmlCarattere: "antica"`
- `serifNow` starts with `'Iowan Old Style'`

Then click the `moderna` chip:
```js
(async () => {
  // Find moderna chip and click
  const modernaChip = Array.from(document.querySelectorAll('.chip')).find(c => c.textContent.trim() === 'moderna');
  modernaChip?.click();
  await new Promise(r => setTimeout(r, 50));
  return {
    htmlCarattere: document.documentElement.dataset.carattere,
    serifNow: getComputedStyle(document.documentElement).getPropertyValue('--serif').trim().slice(0, 40),
    bodySerif: getComputedStyle(document.body).fontFamily.slice(0, 60),
  };
})()
```
Expected: `htmlCarattere: "moderna"`, `serifNow` starts with `"Bodoni 72"`, `bodySerif` includes Bodoni / Cambria / etc.

The body text, wordmark, errata corrections, quiz question, ToC labels — all should visibly change to the Bodoni-style stack. Mono chrome stays unchanged.

- [ ] **Step 9: Commit**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git add lib/store/ui.ts app/layout.tsx components/shell/ClientShell.tsx components/shell/TweaksPanel.tsx app/globals.css && git rm components/shell/ThemeToggle.tsx && git commit -m "feat(m10): carattere axis — antica/moderna font picker replaces voce"
```

---

## Task 16: Final smoke pass

**Files:**
- (verification only, possibly minor CSS fixes if regressions found)

- [ ] **Step 1: Reset state for a clean smoke test**

```js
(() => {
  localStorage.removeItem('postilla.state.v1');
  localStorage.removeItem('studiolo.ui.v1');
  location.href = '/';
  return 'reset';
})()
```

- [ ] **Step 2: Walk every view in giorno theme + antica carattere**

Visit `/`, `/studiare`, `/aggiungi`, `/dettatura`, `/statistiche`. On each: snapshot via `mcp__Claude_Preview__preview_snapshot`, check no console errors. The first run is implicit smoke — if anything renders broken, fix it.

- [ ] **Step 3: Switch to notte theme**

```js
(() => {
  document.documentElement.dataset.theme = 'dark';
  return 'dark';
})()
```
Walk all 5 views again. Check the two-reds invariant on each (`--errata` red on italic correction lines; `--alarm` red only on the `.alarm-banner` if it's showing). Verify text contrast — no muted-on-muted regressions.

- [ ] **Step 4: Switch to moderna carattere**

```js
(() => {
  document.documentElement.dataset.carattere = 'moderna';
  return 'moderna';
})()
```
Walk all 5 views. The serif should be visibly different. Mono chrome unchanged.

- [ ] **Step 5: Test with reduced-motion**

DevTools → ⋮ → More tools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`.
- Open Studiare, grade a card correctly: it should auto-advance, but no transition animation
- Open Dettatura, click Iniziare: stage should transition phases without animation
- Modal (open import preview): no fadein animation

- [ ] **Step 6: Test on a 375px-wide viewport**

DevTools → Toggle device toolbar → iPhone SE (375×667). Walk all 5 views. The errata hero should reflow correctly, the chip row should fit, the apparatus should drop below the quiz card on Studiare (`@media max-width: 760px` rule).

- [ ] **Step 7: Test offline**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npm run build && npx -y serve out -l 3211 &
sleep 3
```
Open `http://localhost:3211/`. DevTools → Application → Service Workers → confirm registered. DevTools → Network → check "Offline" → reload. App should load and be fully usable.

- [ ] **Step 8: Run the full test suite + tsc one final time**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && npx tsc --noEmit && npm test 2>&1 | tail -5
```

- [ ] **Step 9: Commit (smoke pass log)**

```bash
cd "/c/Users/aliza/Downloads/studiolo" && git commit --allow-empty -m "test(m10): final smoke pass — all 5 views × giorno/notte × antica/moderna × reduced-motion × mobile × offline"
```

---

## Phase 1 done

After Task 16, every item from §verification of the spec passes:
1. ✓ Open the app online or offline-after-first-visit
2. ✓ Seed 25 cards on `/`
3. ✓ Study a session with right/wrong tracking
4. ✓ Add a card via `/aggiungi` with auto-detect
5. ✓ Run a dictation drill with adjustable duration + visibility-pause
6. ✓ Browse the alphabetical concordance on `/statistiche`
7. ✓ Toggle Aspetto: theme/carattere/severità/errata/install
8. ✓ Esporta a JSON, clear localStorage, Importa it back via Sostituisci or Aggiungi
9. ✓ Install to home screen (Chrome/Edge); use offline
10. ✓ Press Esc from any view to return to Coda

If anything in step 16's smoke pass fails, file a follow-up rather than expanding M10's scope further.

---

## Notes for the executing agent

- Use `mcp__Claude_Preview__preview_eval` for browser interactions (the dev server is on port 3210; the `studiolo-next` launch entry restarts it)
- Tests are run with `npm test` (Vitest); single-file with `npm test -- tests/path/to/file.test.ts`
- tsc check: `npx tsc --noEmit`
- The dev server may need to be restarted after `next.config.ts` changes (Task 10)
- `mcp__Claude_Preview__preview_screenshot` is known to time out on this Next 16 dev server; rely on `preview_snapshot` and `preview_inspect` instead (memory: ref_studiolo_devserver)
- Each task ends with a commit; if the working tree is dirty between tasks, consider running `git status` before adding files to avoid sweeping unrelated work into the commit
