"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let stashedPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
let listenersBound = false;

function notify() {
  subscribers.forEach((fn) => fn());
}

function bindListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
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
 * Returns the install handler when the browser has fired `beforeinstallprompt`,
 * or `null` otherwise (Safari / already-installed / unsupported).
 */
export function useInstallPrompt(): null | (() => Promise<void>) {
  const [, setTick] = useState(0);
  useEffect(() => {
    bindListeners();
    const sub = () => setTick((n) => n + 1);
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  if (!stashedPrompt) return null;
  return async () => {
    if (!stashedPrompt) return;
    await stashedPrompt.prompt();
    await stashedPrompt.userChoice;
    stashedPrompt = null;
    notify();
  };
}
