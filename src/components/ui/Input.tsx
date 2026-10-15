import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className, required, ...rest }, ref) {
    const inputId = id ?? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-xs font-bold text-ink dark:text-neutral-200">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 rounded-lg border bg-white px-[11px] text-sm text-ink placeholder:text-muted dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            error ? "border-[#c2413a]" : "border-[#d8e0ec]",
            className,
          )}
          {...rest}
          required={required}
        />
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[#c2413a] dark:text-red-400">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-[11px] text-muted dark:text-neutral-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
