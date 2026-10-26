import { cn } from "@/lib/cn";
import type { PasswordCheck } from "@/lib/password";

/**
 * Visual password-strength meter. The rules live in lib/password so the same
 * checks are used on the forgot/reset pages and in Settings.
 */
export function PasswordStrength({
  check,
  id,
}: {
  check: PasswordCheck;
  /** Optional id so inputs can reference the hints with aria-describedby. */
  id?: string;
}) {
  // Stay quiet until the user has typed something; the field hint already
  // explains the requirements.
  if (check.empty) return null;
  const barColors = [
    "bg-slate-200 dark:bg-neutral-700",
    "bg-red-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
  ];
  return (
    <div id={id} className="mt-2 flex flex-col gap-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                "h-full flex-1 rounded-full",
                index < check.score ? barColors[check.score] : barColors[0],
              )}
            />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-semibold text-muted dark:text-neutral-400">
          {check.label}
        </span>
      </div>
      {check.issues.length > 0 ? (
        <ul className="list-inside list-disc text-[11px] text-muted dark:text-neutral-400">
          {check.issues.slice(0, 3).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
