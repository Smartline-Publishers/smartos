"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Supporting line under the title. */
  description?: string;
  children: ReactNode;
  /** Optional pinned footer (kept above the home indicator). */
  footer?: ReactNode;
  /** Extra classes for the sheet panel. */
  className?: string;
}

/**
 * iOS-style modal bottom sheet.
 *
 * <p>Presents from the bottom edge with a grabber, a translucent backdrop and
 * a native-feeling spring back when a drag is released. Dragging the header
 * past the threshold dismisses the sheet; the backdrop, Escape key and close
 * button do the same. Focus is trapped while open and returned on close.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: BottomSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const dragRef = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    offset: 0,
  });
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  const finishClose = useCallback(() => {
    setClosing(false);
    setDragY(0);
    setDragging(false);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setDragging(false);
    setDragY(panelRef.current?.getBoundingClientRect().height ?? 640);
    window.setTimeout(finishClose, 200);
  }, [closing, finishClose]);

  // Keep the latest closer available to the document-level key handler.
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    setClosing(false);
    setDragY(0);
    setDragging(false);

    const panel = panelRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCloseRef.current();
        return;
      }
      if (event.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (element) => element.offsetParent !== null,
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const now = performance.now();
    dragRef.current = {
      active: true,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: now,
      velocity: 0,
      offset: dragY,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const now = performance.now();
    const next = Math.max(0, event.clientY - drag.startY + drag.offset);
    if (now > drag.lastTime) {
      drag.velocity = (event.clientY - drag.lastY) / (now - drag.lastTime);
    }
    drag.lastY = event.clientY;
    drag.lastTime = now;
    drag.offset = next;
    setDragY(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // A short flick or a deliberate pull both dismiss, matching iOS sheets.
    if (drag.offset > 104 || drag.velocity > 0.55) {
      requestCloseRef.current();
    } else {
      setDragY(0);
    }
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
      <div
        aria-hidden="true"
        onClick={requestClose}
        className={cn(
          "absolute inset-0 bg-[#07111f]/45 backdrop-blur-[2px] transition-opacity duration-200",
          "animate-[fade-in_.2s_ease-out]",
          closing && "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px]",
          "border-t border-white/70 bg-white shadow-[0_-16px_60px_rgb(2_6_23/0.28)] outline-none",
          "animate-[sheet-up_.28s_cubic-bezier(0.32,0.72,0,1)]",
          "dark:border-neutral-700/70 dark:bg-neutral-900 dark:shadow-[0_-16px_60px_#00000080]",
          className,
        )}
        style={{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : "transform 340ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Grabber + title. Dragging this region dismisses the sheet. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-neutral-600"
          />
          <div className="flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-[20px] font-bold tracking-[-0.3px] text-ink dark:text-neutral-100"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-0.5 text-[13px] leading-snug text-muted dark:text-neutral-400"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={requestClose}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
          {children}
        </div>

        {footer ? (
          <div
            className="shrink-0 border-t border-line px-4 pt-3 dark:border-neutral-800"
            style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : (
          <div aria-hidden="true" className="shrink-0" style={{ height: "env(safe-area-inset-bottom)" }} />
        )}
      </div>
    </div>,
    document.body,
  );
}
