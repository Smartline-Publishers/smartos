import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Book, BookStatus } from "@/types/book";

const BOOK_STATUSES = [
  "DRAFT",
  "IN_EDIT",
  "DESIGNED",
  "PRINTING",
  "PUBLISHED",
  "ARCHIVED",
] as const satisfies readonly BookStatus[];

export const CreateBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  isbn: z.string().max(20).optional().or(z.literal("")),
  status: z.enum(BOOK_STATUSES).optional(),
});

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export const UpdateBookSchema = CreateBookSchema.partial();
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;

export interface ListBooksParams extends PagedParams {
  status?: BookStatus | "";
}

export async function listBooks(params: ListBooksParams): Promise<Page<Book>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const res = await api.get<ApiEnvelope<SpringPage<Book>>>(`/books?${q.toString()}`);
  return toPage(res.data);
}

export async function getBook(id: string): Promise<Book> {
  const res = await api.get<ApiEnvelope<Book>>(`/books/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const parsed = CreateBookSchema.parse(input);
  const res = await api.post<ApiEnvelope<Book>>("/books", parsed);
  return res.data;
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  const parsed = UpdateBookSchema.parse(input);
  const res = await api.patch<ApiEnvelope<Book>>(
    `/books/${encodeURIComponent(id)}`,
    parsed,
  );
  return res.data;
}
