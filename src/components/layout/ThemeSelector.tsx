"use client";

import { Monitor, Moon, Sun, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useTheme, type ThemeChoice } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemeChoice; label: string; icon: PhosphorIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Appearance switcher: System / Light / Dark. Applies instantly, no reload. */
export function ThemeSelector({ className }: { className?: string }) {
  const { choice, setChoice } = useTheme();

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-900",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = choice === opt.value;
        const ItemIcon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setChoice(opt.value)}
            aria-pressed={active}
            aria-label={`${opt.label} mode`}
            title={`${opt.label} mode`}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              active
                ? "bg-navy-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            )}
          >
            <ItemIcon size={14} aria-hidden="true" className="shrink-0" />
            <span className="hidden xl:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
