import { useId } from "react";
import { cn } from "@/lib/cn";

export interface SparklineProps {
  data: number[];
  /** Text alternative describing the trend, e.g. "Sales rising over 12 weeks". */
  label: string;
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}

/** Minimal SVG sparkline. Color comes from `currentColor` — set text color on the parent. */
export function Sparkline({
  data,
  label,
  width = 120,
  height = 36,
  className,
  strokeWidth = 2,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, "");
  const points = data.length >= 2 ? data : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map(
    (v, i) => [i * stepX, height - 4 - ((v - min) / span) * (height - 8)] as const,
  );
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
      className={cn("h-9 w-28", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} aria-hidden="true" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />
    </svg>
  );
}
