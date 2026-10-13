"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { listContributors } from "@/features/contributors/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Contributor } from "@/types/book";
import type { Page } from "@/types/api";

export default function ContributorsPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [data, setData] = useState<Page<Contributor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = query.toParams();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listContributors(params)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message ?? "Failed to load contributors");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search]);

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Contributors"
            description="Authors, editors, illustrators and translators linked to your titles."
          />
          <Input
            label="Search"
            placeholder="Name or email…"
            value={query.search}
            onChange={(e) => query.setSearch(e.target.value)}
          />
          {loading ? (
            <Spinner label="Loading contributors…" />
          ) : error ? (
            <EmptyState title="Could not load contributors" description={error} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No contributors found" description="Try a different search." />
          ) : (
            <>
              <Table<Contributor>
                caption="Contributors"
                columns={[
                  { key: "name", header: "Name", render: (c) => c.fullName },
                  { key: "type", header: "Type", render: (c) => c.type },
                  { key: "email", header: "Email", render: (c) => c.email ?? "—" },
                ]}
                rows={data.items}
                getRowKey={(c) => c.id}
              />
              <Pagination page={query.page} pageSize={query.pageSize} total={data.total} onPageChange={query.setPage} />
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
