import { cn } from "@/lib/cn";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutProps {
  segments: DonutSegment[];
  /** Text alternative, e.g. "6 of 20 titles published, 8 in production". */
  label: string;
  size?: number;
  thickness?: number;
  centerTop: string;
  centerBottom: string;
  className?: string;
}

/** Donut chart with a value legend — status is never carried by color alone. */
export function Donut({
  segments,
  label,
  size = 168,
  thickness = 24,
  centerTop,
  centerBottom,
  className,
}: DonutProps) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  let acc = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={label}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - thickness) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            aria-hidden="true"
            className="text-[#edf1f7] dark:text-neutral-800"
          />
          {segments.map((s) => {
            const pct = (s.value / total) * 100;
            const start = acc;
            acc += pct;
            if (pct <= 0) return null;
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={(size - thickness) / 2}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                pathLength={100}
                strokeDasharray={`${Math.max(pct - 1.5, 0.5)} ${100 - Math.max(pct - 1.5, 0.5)}`}
                strokeDashoffset={-start + 25}
                strokeLinecap="butt"
                aria-hidden="true"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-neutral-100">{centerTop}</span>
          <span className="text-xs text-slate-600 dark:text-neutral-400">{centerBottom}</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-neutral-300">{s.label}</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
