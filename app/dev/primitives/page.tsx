import {
  Hairline,
  RuleAbove,
  RuleBelow,
  SmallCaps,
  RomanNumeral,
  PageNumber,
  ChipRow,
  Chip,
  TocRow,
  ErrataLine,
} from "@/components/primitives";

/**
 * /dev/primitives — visual smoke-test for the typographic primitives.
 *
 * Not part of the user-facing app. Use this page while building views to
 * confirm primitive output before composing them into views. Delete the
 * `app/dev/` folder before shipping if you want to be tidy (Next will strip
 * it automatically from the production build only if you hide it behind
 * a flag — but the cost of leaving it is ~2KB).
 */
export default function PrimitivesShowcase() {
  const HOUR = 3_600_000;
  const DAY = 86_400_000;
  const now = Date.now();

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      <header>
        <div className="section-label">
          <span>Primitives</span>
          <span className="rule" aria-hidden />
          <span className="pageno">dev</span>
        </div>
        <p style={{ color: "var(--muted)", fontStyle: "italic", maxWidth: "44ch" }}>
          [ visual regression page · not user-facing · delete before ship ]
        </p>
      </header>

      <Section title="Hairline">
        <Hairline />
        <p style={S.muted}>default 0.5px var(--hair)</p>
        <Hairline weight={2} color="var(--fg)" />
        <p style={S.muted}>weight=2 color=var(--fg) — emphatic</p>
      </Section>

      <Section title="Rule above / below">
        <RuleAbove>
          <div style={{ padding: 24 }}>
            <SmallCaps>framed content</SmallCaps>
          </div>
        </RuleAbove>
        <RuleBelow>
          <div style={{ padding: 24 }}>
            <SmallCaps>more framed content</SmallCaps>
          </div>
        </RuleBelow>
      </Section>

      <Section title="Small caps">
        <SmallCaps>questo è un'etichetta</SmallCaps>
        <br />
        <SmallCaps tracking={0.32}>traccia più larga</SmallCaps>
      </Section>

      <Section title="Roman numerals">
        <p>
          1: <RomanNumeral n={1} /> &nbsp; 4: <RomanNumeral n={4} /> &nbsp;
          9: <RomanNumeral n={9} /> &nbsp; 14: <RomanNumeral n={14} /> &nbsp;
          1989: <RomanNumeral n={1989} />
        </p>
        <p>
          With suffix: <RomanNumeral n={3} suffix="." /> Studiare
        </p>
        <p>
          Page number: <PageNumber n={89} /> &nbsp; <PageNumber n={144} /> &nbsp; <PageNumber n={2026} />
        </p>
      </Section>

      <Section title="Errata block">
        <RuleAbove>
          <div style={{ padding: "24px 16px 32px" }}>
            <div className="errata-list" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <ErrataLine
                index={1}
                wrong="il problema"
                correct="il problema"
                ctx="genere"
                when={now - 2 * HOUR}
              />
              <ErrataLine
                index={2}
                wrong="ho andato"
                correct="sono andato"
                ctx="ausiliare"
                when={now - 1 * DAY - 4 * HOUR}
              />
              <ErrataLine
                index={3}
                wrong="penso a che"
                correct="penso che"
                ctx="preposizione"
                when={now - 3 * DAY}
              />
            </div>
          </div>
        </RuleAbove>
      </Section>

      <Section title="Chip row">
        <ChipRow>
          <Chip active>Tutte</Chip>
          <Chip count={7}>Sostantivi</Chip>
          <Chip count={7}>Verbi</Chip>
          <Chip count={4}>Pronomi</Chip>
          <Chip count={3}>Deboli</Chip>
        </ChipRow>
      </Section>

      <Section title="Toc row (Indice)">
        <div style={{ borderTop: "0.5px solid var(--hair)" }}>
          <TocRow marker={1} label="Studiare" href="/studiare" />
          <TocRow marker={2} label="Aggiungi" href="/aggiungi" />
          <TocRow marker={3} label="Dettatura" href="/dettatura" />
          <TocRow marker="-..." label="Statistiche" href="/statistiche" />
        </div>
      </Section>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        style={{
          font: "italic 600 22px/1 var(--serif)",
          margin: "0 0 16px",
          color: "var(--fg)",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

const S = {
  muted: { color: "var(--muted)", fontSize: 13, fontStyle: "italic" as const, margin: 0 },
};
