"use client";

import { useEffect, useState } from "react";

const DAYS_IT = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MONTHS_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

function formatItalianDate(d: Date): string {
  const day = DAYS_IT[d.getDay()];
  const month = MONTHS_IT[d.getMonth()];
  return `studiolo · ${day} ${d.getDate()} ${month}`;
}

export function RunningHead() {
  const [text, setText] = useState("studiolo");
  useEffect(() => {
    setText(formatItalianDate(new Date()));
  }, []);
  return <div className="running-head" suppressHydrationWarning>{text}</div>;
}
