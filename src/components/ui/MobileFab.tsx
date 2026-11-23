"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, X, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface MobileFabAction {
  label: string;
  icon: PhosphorIcon;
  onClick: () => void;
  disabled?: boolean;
}

export interface MobileFabProps {
  /** Two or more actions open a speed-dial stack. */
  actions?: MobileFabAction[];
  /** Single-action shorthand. Ignored when `actions` is provided. */
  label?: string;
  icon?: PhosphorIcon;
  onClick?: () => void;
  /** Accessible name for the speed-dial trigger. */
  menuLabel?: string;
  className?: string;
}

/**
 * Contextual mobile call to action.
 *
 * <p>One action renders as an extended pill ("New book") so the primary task
 * is unmistakable. Several actions collapse into a speed-dial stack: the
 * floating button reveals labelled shortcuts without crowding the screen.
 * Desktop keeps its page-header actions, so this is hidden from `md` up.
 */
export function MobileFab({
  actions,
  label,
  icon,
  onClick,
  menuLabel = "Open actions",
  className,
}: MobileFabProps) {
  const items: MobileFabAction[] =
    actions && actions.length > 0
      ? actions
      : label && onClick
        ? [{ label, icon: icon ?? Plus, onClick }]
        : [];

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => firstActionRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  const position = {
    right: "max(1rem, env(safe-area-inset-right))",
    // Clear the floating bottom dock, which sits just above the home indicator.
    bottom: "calc(6.25rem + env(safe-area-inset-bottom))",
  } as const;

  // A single action needs no menu: an extended pill is one tap, not two.
  if (items.length === 1) {
    const only = items[0];
    const OnlyIcon = only.icon;
    return (
      <div className={cn("fixed z-40 md:hidden", className)} style={position}>
        <button
          type="button"
          onClick={only.onClick}
          disabled={only.disabled}
          className={cn(
            "flex h-14 max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full px-5 text-[15px] font-semibold",
            "bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))] shadow-[0_10px_30px_rgb(2_6_23/0.28)]",
            "transition-[transform,background-color] duration-150 active:scale-[0.96]",
            "hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <OnlyIcon size={22} weight="bold" aria-hidden="true" className="shrink-0" />
          <span className="truncate">{only.label}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("fixed z-40 flex flex-col items-end gap-3 md:hidden", className)} style={position}>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close actions"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 cursor-default bg-[#07111f]/15 backdrop-blur-[1px]"
          />
          <div
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            className="flex flex-col items-end gap-2.5"
          >
            {items.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <div
                  key={action.label}
                  className="flex animate-[fab-in_.18s_ease-out] justify-end"
                  style={{ animationDelay: `${index * 24}ms` }}
                >
                  <button
                    ref={index === 0 ? firstActionRef : undefined}
                    type="button"
                    role="menuitem"
                    aria-label={action.label}
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);
                      action.onClick();
                    }}
                    className={cn(
                      "flex h-12 items-center gap-2.5 rounded-full border border-line bg-white/95 py-1.5 pl-1.5 pr-4",
                      "text-left shadow-[0_8px_24px_rgb(2_6_23/0.16)] backdrop-blur",
                      "transition-[transform,background-color] duration-150 active:scale-[0.97]",
                      "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      "dark:border-neutral-700 dark:bg-neutral-800/95 dark:hover:bg-neutral-700",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    >
                      <ActionIcon size={19} />
                    </span>
                    <span className="whitespace-nowrap text-[14px] font-semibold text-ink dark:text-neutral-100">
                      {action.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close actions" : menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))] shadow-[0_10px_30px_rgb(2_6_23/0.28)]",
          "transition-[transform,background-color] duration-150 active:scale-[0.94]",
          "hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        )}
      >
        {open ? (
          <X size={24} weight="bold" aria-hidden="true" />
        ) : (
          <Plus size={26} weight="bold" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
