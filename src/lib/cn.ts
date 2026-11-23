export type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Minimal clsx-lite: joins truthy class names. */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const walk = (v: ClassValue): void => {
    if (!v && v !== 0) return;
    if (typeof v === "string" || typeof v === "number") {
      if (String(v).length > 0) out.push(String(v));
    } else if (Array.isArray(v)) {
      for (const item of v) walk(item);
    }
  };
  for (const i of inputs) walk(i);
  return out.join(" ");
}
