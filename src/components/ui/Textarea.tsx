import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className, required, ...rest }, ref) {
    const inputId = id ?? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ink dark:text-neutral-200">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-[120px] rounded-xl border bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            "md:min-h-[96px] md:rounded-lg md:px-[11px] md:py-2 md:text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            error ? "border-[#c2413a]" : "border-[#d8e0ec]",
            className,
          )}
          {...rest}
          required={required}
        />
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-[13px] text-[#c2413a] dark:text-red-400">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-muted dark:text-neutral-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
