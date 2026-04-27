"use client";

import { useEffect, useState } from "react";
import type { Tense, Pronoun, ConjugationTable } from "@/lib/srs/types";
import { regularize } from "@/lib/srs/regular-conjugator";

const TENSES: ReadonlyArray<{ v: Tense; label: string }> = [
  { v: "presente", label: "presente" },
  { v: "passato_prossimo", label: "passato prossimo" },
  { v: "imperfetto", label: "imperfetto" },
  { v: "futuro_semplice", label: "futuro semplice" },
];

const PRONOUNS: ReadonlyArray<{ v: Pronoun; label: string }> = [
  { v: "io", label: "io" },
  { v: "tu", label: "tu" },
  { v: "lui", label: "lui / lei" },
  { v: "noi", label: "noi" },
  { v: "voi", label: "voi" },
  { v: "loro", label: "loro" },
];

type Aux = "essere" | "avere";

type CellKey = `${Tense}.${Pronoun}`;
type Cells = Record<CellKey, string>;

function cellKey(t: Tense, p: Pronoun): CellKey {
  return `${t}.${p}` as CellKey;
}

function emptyCells(): Cells {
  const out = {} as Cells;
  for (const t of TENSES) for (const p of PRONOUNS) out[cellKey(t.v, p.v)] = "";
  return out;
}

function cellsToTable(cells: Cells): ConjugationTable {
  const out: ConjugationTable = {};
  for (const t of TENSES) {
    const row: Partial<Record<Pronoun, string>> = {};
    let any = false;
    for (const p of PRONOUNS) {
      const v = cells[cellKey(t.v, p.v)];
      if (v.trim() !== "") {
        row[p.v] = v.trim();
        any = true;
      }
    }
    if (any) out[t.v] = row;
  }
  return out;
}

type Props = {
  initialInfinitive?: string;
  initialTable?: ConjugationTable;
  initialAux?: Aux;
  onSave: (data: { infinitive: string; en: string; conj: ConjugationTable; aux: Aux }) => void;
  onCancel: () => void;
};

export function ConjugationEditor({
  initialInfinitive = "",
  initialTable,
  initialAux = "avere",
  onSave,
  onCancel,
}: Props) {
  const [infinitive, setInfinitive] = useState(initialInfinitive);
  const [en, setEn] = useState("");
  const [aux, setAux] = useState<Aux>(initialAux);
  const [cells, setCells] = useState<Cells>(() => {
    if (!initialTable) return emptyCells();
    const out = emptyCells();
    for (const t of Object.keys(initialTable) as Tense[]) {
      const row = initialTable[t];
      if (!row) continue;
      for (const p of Object.keys(row) as Pronoun[]) {
        const v = row[p];
        if (typeof v === "string") out[cellKey(t, p)] = v;
      }
    }
    return out;
  });
  const [touched, setTouched] = useState<Record<CellKey, boolean>>(() => ({}) as Record<CellKey, boolean>);

  // Reset state when initial values change.
  useEffect(() => {
    if (initialInfinitive) setInfinitive(initialInfinitive);
  }, [initialInfinitive]);

  function setCell(t: Tense, p: Pronoun, v: string) {
    const k = cellKey(t, p);
    setCells((cs) => ({ ...cs, [k]: v }));
    setTouched((tch) => ({ ...tch, [k]: true }));
  }

  function fillRegular() {
    if (!infinitive.match(/(are|ere|ire)$/)) {
      // Don't try; user should write a valid infinitive first.
      return;
    }
    setCells((cs) => {
      const next = { ...cs };
      for (const t of TENSES) {
        const forms = t.v === "passato_prossimo" ? regularize(infinitive, t.v, aux) : regularize(infinitive, t.v);
        if (!forms) continue;
        PRONOUNS.forEach((p, i) => {
          const k = cellKey(t.v, p.v);
          // Don't overwrite cells the user has manually edited.
          if (touched[k]) return;
          next[k] = forms[i] ?? "";
        });
      }
      return next;
    });
  }

  function handleSave() {
    if (!infinitive.trim() || !en.trim()) return;
    onSave({ infinitive: infinitive.trim(), en: en.trim(), conj: cellsToTable(cells), aux });
  }

  return (
    <div className="conj-editor">
      <div className="conj-meta-row">
        <label className="conj-field">
          <span className="conj-field-label">infinito</span>
          <input
            type="text"
            className="conj-field-input"
            value={infinitive}
            onChange={(e) => setInfinitive(e.target.value)}
            placeholder="es. andare"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </label>
        <label className="conj-field">
          <span className="conj-field-label">inglese</span>
          <input
            type="text"
            className="conj-field-input"
            value={en}
            onChange={(e) => setEn(e.target.value)}
            placeholder="es. to go"
            spellCheck={false}
          />
        </label>
        <fieldset className="conj-aux">
          <legend className="conj-field-label">ausiliare (passato prossimo)</legend>
          <label>
            <input type="radio" name="aux" checked={aux === "avere"} onChange={() => setAux("avere")} />
            avere
          </label>
          <label>
            <input type="radio" name="aux" checked={aux === "essere"} onChange={() => setAux("essere")} />
            essere
          </label>
        </fieldset>
      </div>

      <div className="conj-actions-top">
        <button type="button" className="avanti-btn ghost" onClick={fillRegular}>
          regolare ↓
        </button>
        <span className="conj-hint">
          <em>Regolare</em> riempie le celle non toccate · gli irregolari li scrivi a mano.
        </span>
      </div>

      <table className="conj-table">
        <thead>
          <tr>
            <th></th>
            {PRONOUNS.map((p) => (
              <th key={p.v}>
                <span className="conj-pronoun">{p.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TENSES.map((t) => (
            <tr key={t.v}>
              <th scope="row" className="conj-tense">
                <em>{t.label}</em>
              </th>
              {PRONOUNS.map((p) => (
                <td key={p.v}>
                  <input
                    type="text"
                    className="conj-cell"
                    value={cells[cellKey(t.v, p.v)]}
                    onChange={(e) => setCell(t.v, p.v, e.target.value)}
                    spellCheck={false}
                    autoCapitalize="none"
                    autoCorrect="off"
                    data-touched={touched[cellKey(t.v, p.v)] ? "true" : undefined}
                    aria-label={`${t.label} ${p.label}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="conj-actions">
        <button
          type="button"
          className="avanti-btn"
          onClick={handleSave}
          disabled={!infinitive.trim() || !en.trim()}
        >
          Iscrivere ↵
        </button>
        <button type="button" className="avanti-btn ghost" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>
  );
}
