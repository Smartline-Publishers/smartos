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
export function ThemeSelector({
  className,
  size = "sm",
}: {
  className?: string;
  /** `md` gives each choice a comfortable 44px mobile touch target. */
  size?: "sm" | "md";
}) {
  const { choice, setChoice } = useTheme();

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-white p-0.5 dark:border-neutral-700 dark:bg-neutral-900",
        size === "md" && "w-full rounded-xl p-1",
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
              "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              size === "md"
                ? "h-10 flex-1 rounded-lg px-2 text-sm"
                : "h-7 px-2 text-xs",
              active
                ? "bg-navy-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            )}
          >
            <ItemIcon size={size === "md" ? 18 : 14} aria-hidden="true" className="shrink-0" />
            <span className={size === "md" ? "inline" : "hidden xl:inline"}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
