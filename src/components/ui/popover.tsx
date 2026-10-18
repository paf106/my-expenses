"use client";

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/utils";

type Position = { top: number; left: number; maxHeight: number };
const isMobileSheetViewport = (enabled: boolean) => typeof window !== "undefined" && enabled && window.matchMedia("(max-width: 767px)").matches;

export function Popover({
  label,
  trigger,
  children,
  align = "start",
  panelClassName,
  className,
  mobileSheet = false,
  panelRole,
  portal = true,
  portalToDialog = false,
}: {
  label: string;
  trigger: (props: { onClick: () => void; expanded: boolean; controls: string; triggerRef: RefObject<HTMLButtonElement | null> }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  className?: string;
  mobileSheet?: boolean;
  panelRole?: "menu" | "listbox" | "dialog";
  portal?: boolean;
  portalToDialog?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [portalContainer, setPortalContainer] = useState<Element | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const panelId = useId();
  const close = useCallback((returnFocus = true) => { setRestoreFocus(returnFocus); setOpen(false); }, []);
  const toggle = () => {
    if (open) {
      close(false);
      return;
    }
    setPortalContainer(portalToDialog ? root.current?.closest("dialog") || null : null);
    const triggerBounds = root.current?.getBoundingClientRect();
    if (!triggerBounds || isMobileSheetViewport(mobileSheet)) {
      setPosition(null);
      setOpen(true);
      return;
    }

    // Estimate menu bounds before opening, then refine them after it mounts.
    const estimatedWidth = Math.min(Math.max(triggerBounds.width, 208), window.innerWidth - 24);
    const left = Math.max(12, Math.min(align === "end" ? triggerBounds.right - estimatedWidth : triggerBounds.left, window.innerWidth - estimatedWidth - 12));
    const estimatedHeight = 260;
    const below = window.innerHeight - triggerBounds.bottom - 20;
    const above = triggerBounds.top - 20;
    const openUp = below < estimatedHeight && above > below;
    const maxHeight = Math.max(120, Math.min(openUp ? above : below, window.innerHeight - 24));
    const top = openUp ? Math.max(12, triggerBounds.top - Math.min(estimatedHeight, maxHeight) - 8) : triggerBounds.bottom + 8;
    setPosition({ top, left, maxHeight });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      if (wasOpen.current && restoreFocus) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const isMobileSheet = isMobileSheetViewport(mobileSheet);
    const ownerDialog = portalToDialog ? root.current?.closest("dialog") : null;
    const updatePosition = () => {
      const triggerBounds = root.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!triggerBounds || !panel || isMobileSheet) return;
      const panelHeight = panel.getBoundingClientRect().height;
      const below = window.innerHeight - triggerBounds.bottom - 20;
      const above = triggerBounds.top - 20;
      const openUp = below < panelHeight && above > below;
      const maxHeight = Math.max(120, Math.min(openUp ? above : below, window.innerHeight - 24));
      const left = Math.max(12, Math.min(align === "end" ? triggerBounds.right - panel.offsetWidth : triggerBounds.left, window.innerWidth - panel.offsetWidth - 12));
      setPosition({ top: openUp ? Math.max(12, triggerBounds.top - Math.min(panelHeight, maxHeight) - 8) : triggerBounds.bottom + 8, left, maxHeight });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target) && !panelRef.current?.contains(event.target)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    const onOwnerDialogClose = () => close(false);
    ownerDialog?.addEventListener("close", onOwnerDialogClose);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const focusInitialItem = () => {
      const selected = panelRef.current?.querySelector<HTMLElement>('[data-popover-item][aria-selected="true"], [data-popover-item][aria-pressed="true"]');
      (selected || panelRef.current?.querySelector<HTMLElement>("[data-popover-item]"))?.focus();
    };
    if (isMobileSheet) focusInitialItem();
    else {
      const frame = window.requestAnimationFrame(() => {
        updatePosition();
        focusInitialItem();
      });
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
        ownerDialog?.removeEventListener("close", onOwnerDialogClose);
      };
    }
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      ownerDialog?.removeEventListener("close", onOwnerDialogClose);
    };
  }, [open, align, mobileSheet, close, restoreFocus, portalToDialog]);

  const panel = open ? <>
    {mobileSheet && <div className="fixed inset-0 z-[59] bg-[var(--scrim)] backdrop-blur-[2px] md:hidden" aria-hidden="true" onClick={() => close(false)} />}
    <div
      ref={panelRef}
      id={panelId}
      role={panelRole}
      aria-label={panelRole ? label : undefined}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          close(true);
          return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = [...(panelRef.current?.querySelectorAll<HTMLElement>("[data-popover-item]") || [])];
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (event.key === "Home") { items[0]?.focus(); event.preventDefault(); return; }
        if (event.key === "End") { items.at(-1)?.focus(); event.preventDefault(); return; }
        const step = event.key === "ArrowDown" ? 1 : -1;
        items[(index + step + items.length) % items.length]?.focus();
        event.preventDefault();
      }}
      style={{ transformOrigin: align === "end" ? "top right" : "top left", ...(!isMobileSheetViewport(mobileSheet) && position ? { position: "fixed" as const, top: position.top, left: position.left, width: "max-content", maxWidth: "calc(100vw - 24px)", maxHeight: position.maxHeight } : {}) }}
      className={cx(
        "popover-panel popover-enter z-[80] min-w-52 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--ink)] shadow-[0_14px_40px_rgba(10,20,40,.2)]",
        !isMobileSheetViewport(mobileSheet) && !position && (align === "end" ? "right-0" : "left-0"),
        mobileSheet && "!fixed !inset-x-2 !bottom-[calc(env(safe-area-inset-bottom)+90px)] !left-auto !right-auto !top-auto !z-[80] !max-h-[min(56dvh,440px)] !w-auto !overflow-y-auto !rounded-[26px] !p-4",
        panelClassName,
      )}
    >{children(close)}</div>
  </> : null;

  return <div ref={root} className={cx("relative inline-flex", className)}>
    {trigger({ onClick: toggle, expanded: open, controls: panelId, triggerRef })}
    {panel && (portal && typeof document !== "undefined" ? createPortal(panel, portalContainer || document.body) : panel)}
  </div>;
}
