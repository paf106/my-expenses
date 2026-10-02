"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSheetDismiss(onDismiss: () => void, duration = 240) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useCallback((afterDismiss: () => void = onDismiss) => {
    if (closing) return;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      setClosing(false);
      afterDismiss();
    }, reducedMotion ? 0 : duration);
  }, [closing, duration, onDismiss]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { closing, dismiss };
}
