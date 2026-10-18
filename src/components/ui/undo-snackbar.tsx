"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { cx } from "@/lib/utils";

type UndoSnackbarProps = {
  title: string;
  detail: string;
  amount?: string;
  amountClassName?: string;
  icon: React.ReactNode;
  onUndo: () => void;
  onClose: () => void;
  restoring?: boolean;
  error?: string;
  duration?: number;
  autoFocus?: boolean;
};

export function UndoSnackbar({ title, detail, amount, amountClassName, icon, onUndo, onClose, restoring = false, error, duration = 12000, autoFocus = false }: UndoSnackbarProps) {
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const deadline = useRef(0);
  const remaining = useRef(duration);
  const pauseReasons = useRef(new Set<"pointer" | "focus" | "restore">());
  const onCloseRef = useRef(onClose);
  const [paused, setPaused] = useState(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    const scheduleClose = () => {
      deadline.current = Date.now() + remaining.current;
      timer.current = window.setTimeout(() => onCloseRef.current(), remaining.current);
    };
    scheduleClose();
    return () => { if (timer.current !== null) window.clearTimeout(timer.current); };
  }, [duration]);

  useEffect(() => {
    if (autoFocus) root.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (restoring) pause("restore");
    else resume("restore");
  }, [restoring]);

  function pause(reason: "pointer" | "focus" | "restore") {
    pauseReasons.current.add(reason);
    if (timer.current !== null) {
      remaining.current = Math.max(0, deadline.current - Date.now());
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setPaused(true);
  }

  function resume(reason: "pointer" | "focus" | "restore") {
    pauseReasons.current.delete(reason);
    if (pauseReasons.current.size > 0 || timer.current !== null) return;
    setPaused(false);
    deadline.current = Date.now() + remaining.current;
    timer.current = window.setTimeout(() => onCloseRef.current(), remaining.current);
  }

  return <div
    ref={root}
    className={cx("undo-snackbar glass-surface snackbar-enter fixed z-40", (paused || restoring) && "is-paused")}
    style={{ "--snackbar-duration": `${duration}ms` } as React.CSSProperties}
    role="status"
    aria-live="polite"
    aria-atomic="true"
    onPointerEnter={(event) => { if (event.pointerType === "mouse") pause("pointer"); }}
    onPointerLeave={(event) => { if (event.pointerType === "mouse") resume("pointer"); }}
    onFocusCapture={(event) => { if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) pause("focus"); }}
    onBlurCapture={(event) => {
      if (event.relatedTarget instanceof Node && root.current?.contains(event.relatedTarget)) return;
      resume("focus");
    }}
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }}
  >
    <span className="undo-snackbar-icon" aria-hidden="true">{icon}</span>
    <span className="undo-snackbar-copy">
      <span className="undo-snackbar-title">{title}</span>
      <span className="undo-snackbar-detail">
        <span className="undo-snackbar-description">{detail}</span>
        {amount && <span className={cx("undo-snackbar-amount", amountClassName)}>{amount}</span>}
      </span>
      {error && <span className="undo-snackbar-error" role="alert">{error}</span>}
    </span>
    <button type="button" onClick={onUndo} disabled={restoring} className="undo-snackbar-action">
      {restoring ? <span className="undo-snackbar-spinner" aria-hidden="true"/> : <RotateCcw size={15} aria-hidden="true"/>}
      <span>{restoring ? "Restaurando…" : "Deshacer"}</span>
    </button>
    <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="undo-snackbar-close"><X size={17}/></button>
    <span key={duration} className="undo-snackbar-progress" aria-hidden="true"/>
  </div>;
}
