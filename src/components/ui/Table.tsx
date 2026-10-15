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
    <div className="shell-scroll overflow-x-auto rounded-xl border border-line bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table className="w-full border-collapse text-left">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-[#fafbfd] dark:bg-neutral-800/60">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className="px-[14px] py-3 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted dark:text-neutral-400"
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
                <td key={c.key} className="px-[14px] py-3 align-middle text-xs text-ink dark:text-neutral-200">
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
