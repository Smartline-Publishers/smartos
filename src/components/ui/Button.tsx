import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "border-brand-600 bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))] hover:bg-brand-700 focus-visible:ring-brand-500",
  ghost:
    "border-[#d6dfec] bg-white text-ink hover:bg-slate-50 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
  danger:
    "border-[#e5b8b4] bg-white text-[#c2413a] hover:bg-red-50 focus-visible:ring-red-500 dark:border-red-900 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-[13px] text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", className, type = "button", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...rest}
      />
    );
  },
);
