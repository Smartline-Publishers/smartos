import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      <path d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {crossed ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, id, className, required, type = "text", ...rest },
    ref,
  ) {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    const isPassword = type === "password";
    const resolvedType = isPassword && showPassword ? "text" : type;
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ink dark:text-neutral-200">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-11 w-full rounded-xl border bg-white px-3.5 text-base text-ink placeholder:text-muted dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
              "md:h-10 md:rounded-lg md:px-[11px] md:text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              error ? "border-[#c2413a]" : "border-[#d8e0ec]",
              isPassword && "pr-12 md:pr-11",
              className,
            )}
            {...rest}
            required={required}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:w-10 md:rounded-r-lg dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <EyeIcon crossed={showPassword} />
            </button>
          ) : null}
        </div>
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
