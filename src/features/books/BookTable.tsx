"use client";

import Link from "next/link";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Book } from "@/types/book";

const columns: Column<Book>[] = [
  {
    key: "title",
    header: "Title",
    render: (b) => (
      <Link href={`/books/${b.id}`} className="font-medium text-brand-700 hover:underline">
        {b.title}
      </Link>
    ),
  },
  { key: "isbn", header: "ISBN", render: (b) => b.isbn ?? "—" },
  { key: "status", header: "Status", render: (b) => <Badge status={b.status} /> },
  { key: "updated", header: "Updated", render: (b) => formatDate(b.updatedAt) },
];

export function BookTable({ books }: { books: Book[] }) {
  return (
    <Table<Book>
      caption="Books"
      columns={columns}
      rows={books}
      getRowKey={(b) => b.id}
    />
  );
}
