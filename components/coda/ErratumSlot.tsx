"use client";

import { useEffect, useRef, useState } from "react";
import { RomanNumeral } from "@/components/primitives/Roman";
import { Erratum } from "./Erratum";

export type ErratumItem = {
  key: string;
  index: number;
  wrong: string;
  correct: string;
  ctx?: string;
  when: number;
};

type ErratumSlotProps = {
  /** 0-based slot index. Roman numeral is derived from this — fixed forever. */
  slotIdx: number;
  /** Current item to show in this slot, or null if the queue is shorter. */
  item: ErratumItem | null;
  isActive: boolean;
  onActivate: () => void;
  onMatched: () => void;
};

const ANIM_MS = 520;

/**
 * One slot of the errata block. The Roman numeral on the left is FIXED — it
 * never animates, never moves. The content area (right side) is what swaps
 * when the parent's `item` prop changes: the previous item is held as
 * `animatingOut` for 520ms, animating out via .is-leaving while the new item
 * mounts immediately and slides in. Slot position itself never changes.
 */
export function ErratumSlot({
  slotIdx,
  item,
  isActive,
  onActivate,
  onMatched,
}: ErratumSlotProps) {
  const [animatingOut, setAnimatingOut] = useState<ErratumItem | null>(null);
  const lastKeyRef = useRef<string | null>(item?.key ?? null);
  const lastItemRef = useRef<ErratumItem | null>(item);

  useEffect(() => {
    const newKey = item?.key ?? null;
    if (newKey === lastKeyRef.current) return;
    // Item changed — capture the previous one for the leaving animation.
    setAnimatingOut(lastItemRef.current);
    lastKeyRef.current = newKey;
    lastItemRef.current = item;
    const t = window.setTimeout(() => setAnimatingOut(null), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [item]);

  // Keep the ref synced (without causing re-runs of the swap effect).
  useEffect(() => {
    lastItemRef.current = item;
  });

  return (
    <div className="erratum-slot">
      <div className="num">
        <RomanNumeral n={slotIdx + 1} suffix="." />
      </div>
      <div className="erratum-window">
        {animatingOut && (
          <Erratum
            key={animatingOut.key}
            wrong={animatingOut.wrong}
            correct={animatingOut.correct}
            ctx={animatingOut.ctx}
            when={animatingOut.when}
            isActive={false}
            isLeaving
            onActivate={() => {}}
            onMatched={() => {}}
            onResolved={() => {}}
          />
        )}
        {item && (
          <Erratum
            key={item.key}
            wrong={item.wrong}
            correct={item.correct}
            ctx={item.ctx}
            when={item.when}
            isActive={isActive}
            isLeaving={false}
            onActivate={onActivate}
            onMatched={onMatched}
            onResolved={() => {}}
          />
        )}
      </div>
    </div>
  );
}
