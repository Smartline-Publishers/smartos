import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, options, error, id, className, required, ...rest }, ref) {
    const selectId = id ?? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-10 rounded-md border bg-white px-3 text-sm text-slate-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            error ? "border-red-500" : "border-slate-300",
            className,
          )}
          {...rest}
          required={required}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
