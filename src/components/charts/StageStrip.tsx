import { cn } from "@/lib/cn";

export interface StripStage {
  label: string;
  value: number;
  color: string;
}

export interface StageStripProps {
  stages: StripStage[];
  /** Text alternative summarising the strip. */
  label: string;
  className?: string;
  tone?: "light" | "dark";
}

/** Horizontal stacked strip showing distribution across workflow stages, with a text legend. */
export function StageStrip({ stages, label, className, tone = "light" }: StageStripProps) {
  const total = stages.reduce((n, s) => n + s.value, 0) || 1;
  const dark = tone === "dark";

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={label}
        className={cn(
          "flex h-3 w-full overflow-hidden rounded-full",
          dark ? "bg-white/15" : "bg-slate-100",
        )}
      >
        {stages.map((s) =>
          s.value > 0 ? (
            <span
              key={s.label}
              aria-hidden="true"
              title={`${s.label}: ${s.value}`}
              className={cn("h-full", s.value === total && "rounded-full")}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            />
          ) : null,
        )}
      </div>
      <ul
        className={cn(
          "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs",
          dark ? "text-cream/80" : "text-slate-600",
        )}
      >
        {stages.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span>
              {s.label} ·{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  dark ? "text-cream" : "text-slate-900",
                )}
              >
                {s.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
