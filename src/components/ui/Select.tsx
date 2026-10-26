import { forwardRef, type SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  /** Short explanatory text shown under the control. */
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, options, error, hint, id, className, required, ...rest }, ref) {
    const selectId = id ?? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const hintId = `${selectId}-hint`;
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="text-[13px] font-semibold text-ink dark:text-neutral-200">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={hint ? hintId : undefined}
            className={cn(
              "h-11 w-full appearance-none truncate rounded-xl border bg-white pl-3.5 pr-10 text-base text-ink",
              "shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-[border-color,background-color] duration-150",
              "hover:border-slate-300 dark:hover:border-neutral-600",
              "md:h-10 md:rounded-lg md:pl-[11px] md:pr-9 md:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted disabled:shadow-none dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500",
              error ? "border-[#c2413a]" : "border-[#d8e0ec] dark:border-neutral-700",
              "dark:bg-neutral-900 dark:text-neutral-100",
              className,
            )}
            {...rest}
            required={required}
          >
            {options.map((o) => (
              <option
                key={o.value}
                value={o.value}
                className="bg-white text-ink dark:bg-neutral-900 dark:text-neutral-100"
              >
                {o.label}
              </option>
            ))}
          </select>
          <CaretDown
            size={16}
            weight="bold"
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-neutral-400 md:right-3"
          />
        </div>
        {hint ? (
          <p id={hintId} className="text-xs text-muted dark:text-neutral-400">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13px] text-[#c2413a] dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
