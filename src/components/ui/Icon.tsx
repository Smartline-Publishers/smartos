export type IconName =
  | "grid"
  | "book"
  | "users"
  | "shield"
  | "search"
  | "bell"
  | "alert"
  | "check"
  | "arrow"
  | "clock"
  | "box"
  | "pen";

const PATHS: Record<IconName, string> = {
  grid: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  book: "M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 16a2 2 0 0 1 2-2h11",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M17 11l2 2 4-4",
  shield: "M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6zM9.5 12l2 2 3.5-3.5",
  search: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12M20 20l-4-4",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  alert: "M12 4l9 16H3zM12 10v4M12 17.5v.5",
  check: "M4 12.5l5 5L20 6.5",
  arrow: "M4 12h15M13 6l6 6-6 6",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16M12 8v4l3 2",
  box: "M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16zM3.5 8L12 12.5 20.5 8M12 12.5V20",
  pen: "M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14.5 6.5l3 3",
};

export interface IconProps {
  name: IconName;
  className?: string;
}

/** Inline stroke icon. Decorative by default — parent controls must carry the accessible name. */
export function Icon({ name, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-5 w-5"}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
