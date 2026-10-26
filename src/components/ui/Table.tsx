import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  caption?: string;
}

export function Table<T>({ columns, rows, getRowKey, caption }: TableProps<T>) {
  return (
    <div
      role="region"
      aria-label={caption ?? "Data table"}
      tabIndex={0}
      className="shell-scroll overflow-x-auto overscroll-x-contain rounded-2xl border border-line bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-800 dark:bg-neutral-900 md:rounded-xl"
    >
      <table className="w-full border-collapse text-left">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-[#fafbfd] dark:bg-neutral-800/60">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className="whitespace-nowrap px-3.5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-muted dark:text-neutral-400 md:px-[14px]"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={getRowKey(row, i)} className="border-t border-[#edf1f6] dark:border-neutral-800">
              {columns.map((c) => (
                <td key={c.key} className="px-3.5 py-3.5 align-middle text-[13px] text-ink dark:text-neutral-200 md:px-[14px] md:py-3 md:text-xs">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
