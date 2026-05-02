#!/usr/bin/env node
/**
 * Convert a plain "english — italian" list into a studiolo import envelope.
 *
 * Usage:
 *   node scripts/import-cards.mjs <input.txt> > <output.json>
 *
 * Input format (one card per line):
 *   the road — la strada
 *   to study — studiare
 *   ...
 *
 * Accepted en/it separators (split on first match):
 *   tab, em-dash (—), en-dash (–), " - ", " | ", " = "
 *
 * Output: a v1 ExportEnvelope JSON, ready to import via
 *   studiolo → Aspetto → backup → Importa → Aggiungi
 *
 * Diagnostics print to stderr; the JSON envelope goes to stdout.
 */

import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/import-cards.mjs <input.txt> [> output.json]");
  process.exit(1);
}

const SEP = / — | – | - |\t| \| | = /;
const ARTICLE_RE = /^(il|lo|la|l['’]|i|gli|le|un|uno|una|un['’])\s/;

/**
 * Tiny category guesser — mirrors lib/text/detectCat at the level of detail
 * needed for bulk import. Returns one of: sostantivo, verbo, altro.
 */
function detectCat(it) {
  const s = it.trim().toLowerCase();
  if (!s) return "altro";
  if (ARTICLE_RE.test(s)) return "sostantivo";
  if (/^l['’]/.test(s)) return "sostantivo";
  const firstWord = s.split(/\s+/)[0];
  if (/(arsi|ersi|irsi)$/.test(firstWord)) return "verbo";
  if (/(are|ere|ire)$/.test(firstWord)) return "verbo";
  return "altro";
}

const text = readFileSync(file, "utf8");
const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

const now = Date.now();
const errors = [];
const cards = lines
  .map((line, i) => {
    const m = line.match(SEP);
    if (!m) {
      errors.push({ line: i + 1, content: line });
      return null;
    }
    const en = line.slice(0, m.index).trim();
    const it = line.slice(m.index + m[0].length).trim();
    if (!en || !it) {
      errors.push({ line: i + 1, content: line });
      return null;
    }
    return {
      id: `bulk-${now.toString(36)}-${i.toString(36)}`,
      en,
      it,
      cat: detectCat(it),
      rung: 0,
      charge: 0,
      due: now + i, // tiny jitter to preserve order
      wrongs: 0,
      reviewed: 0,
      history: [],
      parentId: null,
      isChild: false,
      createdAt: now + i,
    };
  })
  .filter((c) => c !== null);

const envelope = {
  version: 1,
  exportedAt: new Date().toISOString(),
  deck: {
    cards,
    errors: [],
    sessions: [],
    streakLastDay: null,
    streakCount: 0,
    lastBackup: null,
  },
};

process.stdout.write(JSON.stringify(envelope, null, 2));

const byCat = cards.reduce((acc, c) => {
  acc[c.cat] = (acc[c.cat] ?? 0) + 1;
  return acc;
}, {});
const summary = Object.entries(byCat)
  .sort(([, a], [, b]) => b - a)
  .map(([k, v]) => `${v} ${k}`)
  .join(" · ");
process.stderr.write(`✓ ${cards.length} cards · ${summary}\n`);
if (errors.length > 0) {
  process.stderr.write(`✗ ${errors.length} unparseable line(s):\n`);
  for (const e of errors) {
    process.stderr.write(`  L${e.line}: ${e.content}\n`);
  }
}
