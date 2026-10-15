"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ContributorForm } from "@/features/contributors/ContributorForm";
import { createContributor, listContributors, type ContributorInput } from "@/features/contributors/api";
import { ApiError } from "@/lib/api-client";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Contributor } from "@/types/book";
import type { Page } from "@/types/api";

export default function ContributorsPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [data, setData] = useState<Page<Contributor> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();

  const reload = () => {
    setLoading(true);
    setError(null);
    listContributors(params)
      .then((d) => setData(d))
      .catch((e: Error) => setError(e.message ?? "Failed to load contributors"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search]);

  const handleCreate = async (values: ContributorInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      await createContributor(values);
      setCreateOpen(false);
      setFormDirty(false);
      if (params.page === 1) reload();
      else query.setPage(1);
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "Could not create the contributor.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Contributors"
            description="Authors, editors, illustrators and translators linked to your titles."
            actions={
              <Button onClick={() => { setCreateError(null); setCreateOpen(true); }}>
                New contributor
              </Button>
            }
          />
          <Input
            label="Search"
            placeholder="Name or email…"
            value={query.search}
            onChange={(e) => query.setSearch(e.target.value)}
          />
          <Modal
            open={createOpen}
            title="New contributor"
            description="Add someone who works on your titles."
            onClose={() => setCreateOpen(false)}
            isDirty={formDirty}
          >
            <ContributorForm
              key="new-contributor"
              onSubmit={handleCreate}
              submitting={creating}
              onCancel={() => setCreateOpen(false)}
              onDirtyChange={setFormDirty}
            />
            {createError ? (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {createError}
              </p>
            ) : null}
          </Modal>
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
