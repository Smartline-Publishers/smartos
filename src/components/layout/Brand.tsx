"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface BrandProps {
  /** Dark sidebar version (white + tertiary blue) or light version (ink + tertiary blue). */
  tone?: "dark" | "light";
  className?: string;
  /** Compact mark for collapsed sidebar (icon instead of full wordmark). */
  compact?: boolean;
  /** Imprint subline. Hide it when the wordmark is paired with the Smartline logo. */
  tagline?: boolean;
  /** Organization logo URL: shown in place of the "S." mark when set. */
  logoUrl?: string | null;
}

/** SmartOS wordmark: white/ink "Smart" + tertiary-blue "OS" with the imprint subline. */
export function Brand({ tone = "dark", className, compact = false, tagline = true, logoUrl }: BrandProps) {
  const dark = tone === "dark";
  // A custom logo URL can be unreachable (bad URL, offline host). Fall back
  // to the built-in mark instead of rendering a broken-image glyph.
  const [logoOk, setLogoOk] = useState(true);
  useEffect(() => {
    setLogoOk(true);
  }, [logoUrl]);
  const mark = logoUrl && logoOk ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      onError={() => setLogoOk(false)}
      className="h-10 w-10 rounded-[10px] bg-white object-contain"
    />
  ) : (
    // Default collapsed mark: flat blue circle with "S". Kept dependency-free
    // (single element, standard palette token) so it renders identically in
    // every bundle — never a broken image.
    <span
      aria-hidden="true"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-600 text-[20px] font-extrabold leading-none text-[rgb(var(--org-on-tertiary,255_255_255))]"
    >
      S
    </span>
  );
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <span className="sr-only">SmartOS</span>
        {mark}
      </div>
    );
  }
  return (
    <div className={className}>
      <p
        aria-label="SmartOS"
        className="text-[22px] font-extrabold leading-none tracking-[-0.7px]"
      >
        <span className={dark ? "text-[rgb(var(--org-sidebar-fg,255_255_255))]" : "text-ink dark:text-white"}>Smart</span>
        <span className={dark ? "text-tertiary-400" : "text-tertiary-600 dark:text-tertiary-400"} aria-hidden="true">
          OS
        </span>
      </p>
      {tagline ? (
        <p
          className={cn(
            "mt-1 text-[11px] tracking-wide",
            dark ? "text-[rgb(var(--org-sidebar-muted,212_212_212))]" : "text-muted dark:text-neutral-400",
          )}
        >
          SMARTLINE PUBLISHERS LTD
        </p>
      ) : null}
    </div>
  );
}
