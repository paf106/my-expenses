"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type SegmentOption = { id: string; label: string };

export function SegmentedControl({ options, value, onChange, label, className = "" }: { options: SegmentOption[]; value: string; onChange: (value: string) => void; label: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => {
      const selected = element.querySelector<HTMLButtonElement>(`[data-segment="${CSS.escape(value)}"]`);
      if (!selected) return;
      setIndicator({ left: selected.offsetLeft, width: selected.offsetWidth, ready: true });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value, options]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const current = options.findIndex((option) => option.id === value);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    event.preventDefault();
    onChange(options[next].id);
    root.current?.querySelector<HTMLButtonElement>(`[data-segment="${CSS.escape(options[next].id)}"]`)?.focus();
  };

  return <div ref={root} role="group" aria-label={label} onKeyDown={handleKeyDown} className={`segmented-control ${className}`}>
    <span aria-hidden="true" className={`segmented-control-indicator${indicator.ready ? " is-ready" : ""}`} style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}/>
    {options.map((option) => <button key={option.id} data-segment={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)} className={`segmented-control-option${value === option.id ? " is-active" : ""}`}>{option.label}</button>)}
  </div>;
}
