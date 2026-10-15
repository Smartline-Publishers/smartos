"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type ModalSize = "sm" | "md" | "lg";

const SIZES: Record<ModalSize, string> = {
  sm: "w-[min(480px,100%)]",
  md: "w-[min(650px,100%)]",
  lg: "w-[min(900px,100%)]",
};

export interface ModalProps {
  open: boolean;
  title: string;
  /** Optional supporting text rendered under the title (aria-describedby). */
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  /** When true, backdrop clicks never close (X/Escape still do). */
  disableBackdropClose?: boolean;
  /**
   * Pass the form's dirty state to guard against accidental data loss:
   * closing via X, backdrop, or Escape asks for confirmation first.
   * Uses window.confirm, matching the existing delete confirmations.
   */
  isDirty?: boolean;
  dirtyMessage?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = "md",
  disableBackdropClose = false,
  isDirty = false,
  dirtyMessage = "Discard unsaved changes?",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  const requestClose = () => {
    if (isDirty && !window.confirm(dirtyMessage)) return;
    onClose();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const dialog = dialogRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestCloseRef.current();
        return;
      }
      // Simple focus trap: keep Tab cycling inside the dialog.
      if (e.key === "Tab" && dialog) {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      // Return focus to whatever opened the dialog.
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const descriptionId = description ? "modal-description" : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a3280] p-4"
      onClick={disableBackdropClose ? undefined : () => requestClose()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          "shell-scroll max-h-[92vh] overflow-auto rounded-[14px] bg-white p-[23px] shadow-[0_20px_70px_#00132b40] focus-visible:outline-none dark:bg-neutral-900 dark:shadow-[0_20px_70px_#00000080]",
          SIZES[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-[18px] flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold text-ink dark:text-neutral-100">{title}</h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-[13px] text-slate-600 dark:text-neutral-400"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => requestClose()}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
