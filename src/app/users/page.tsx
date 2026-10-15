"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/use-auth";
import {
  createInvite,
  listInvites,
  revokeInvite,
  type CreateInviteInput,
  type Invite,
} from "@/features/invites/api";
import {
  createUser,
  deleteUser,
  listUsers,
  type CreateUserInput,
  type OrgUser,
} from "@/features/users/api";
import { UserForm } from "@/features/users/UserForm";
import { InviteForm } from "@/features/invites/InviteForm";
import { getCurrentOrg, type CurrentOrganization } from "@/features/organization/api";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin =
    user !== null &&
    (user.roles.includes("ORG_ADMIN") || user.roles.includes("PLATFORM_ADMIN"));
  const query = usePagedQuery({ pageSize: 20 });
  const [data, setData] = useState<Page<OrgUser> | null>(null);
  const [org, setOrg] = useState<CurrentOrganization | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersPage, current, pending] = await Promise.all([
        listUsers(params),
        getCurrentOrg(),
        listInvites(),
      ]);
      setData(usersPage);
      setOrg(current);
      setInvites(pending);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize]);

  useEffect(() => {
    if (isAdmin) void refresh();
    else setLoading(false);
  }, [refresh, isAdmin]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, failure: string) => {
      setActionError(null);
      try {
        await fn();
        await refresh();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
      }
    },
    [refresh],
  );

  const onCreateUser = async (values: CreateUserInput) => {
    setUserSubmitting(true);
    try {
      await createUser(values);
      setUserModalOpen(false);
      setFormDirty(false);
      if (params.page === 1) await refresh();
      else query.setPage(1);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create user: ${e.message}` : "Could not create user");
    } finally {
      setUserSubmitting(false);
    }
  };

  const onInvite = async (values: CreateInviteInput) => {
    setInviteSubmitting(true);
    try {
      const created = await createInvite(values);
      setInviteToken(created.token ?? null);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create invite: ${e.message}` : "Could not create invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Users"
            description="Staff accounts, seat usage, and pending invitations."
            actions={
              <>
                <Button variant="ghost" onClick={() => { setInviteToken(null); setInviteModalOpen(true); }}>
                  Invite member
                </Button>
                <Button onClick={() => setUserModalOpen(true)}>
                  Add user
                </Button>
              </>
            }
          />
          {!isAdmin ? (
            <EmptyState
              title="Restricted"
              description="Only organization and platform admins can view the user list."
            />
          ) : (
            <>
              {actionError ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {actionError}
                </p>
              ) : null}
              {loading ? (
                <Spinner label="Loading users…" />
              ) : error ? (
                <EmptyState title="Could not load users" description={error} />
              ) : (
                <>
                  {org ? (
                    <p className="text-[13px] text-slate-600 dark:text-neutral-400" aria-live="polite">
                      Plan <span className="font-semibold text-slate-900 dark:text-neutral-100">{org.plan}</span> ·{" "}
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                        {data?.total ?? 0} of {org.limits.maxUsers}
                      </span>{" "}
                      seats used
                    </p>
                  ) : null}
                  {!data || data.items.length === 0 ? (
                    <EmptyState title="No users" description="Invite the first team member below." />
                  ) : (
                    <>
                      <div className="shell-scroll overflow-x-auto rounded-xl border border-slate-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                        <table className="w-full border-collapse text-left text-sm">
                          <caption className="sr-only">Organization users</caption>
                          <thead className="bg-slate-50 dark:bg-neutral-800/60">
                            <tr>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700 dark:text-neutral-300">Name</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700 dark:text-neutral-300">Email</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700 dark:text-neutral-300">Role</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700 dark:text-neutral-300">Status</th>
                              <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.items.map((u) => (
                              <tr key={u.id} className="border-t border-slate-200 dark:border-neutral-800">
                                <td className="px-4 py-2 font-medium text-slate-900 dark:text-neutral-100">{u.fullName}</td>
                                <td className="px-4 py-2 text-slate-700 dark:text-neutral-300">{u.email}</td>
                                <td className="px-4 py-2 text-xs text-slate-600 dark:text-neutral-400">{u.role.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2">
                                  <Badge status={u.active ? "ACTIVE" : "INACTIVE"} />
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {u.id !== user?.id ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                      onClick={() => {
                                        if (window.confirm(`Remove ${u.email}?`)) {
                                          void runAction(() => deleteUser(u.id), "Remove failed");
                                        }
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-slate-400 dark:text-neutral-500">You</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        page={query.page}
                        pageSize={query.pageSize}
                        total={data.total}
                        onPageChange={query.setPage}
                      />
                    </>
                  )}
                  <div className="grid items-start gap-4 xl:grid-cols-2">
                    <PendingInvitesCard
                      invites={invites}
                      onAction={runAction}
                    />
                  </div>
                  <Modal
                    open={userModalOpen}
                    title="Add user"
                    description="Create a staff account directly."
                    onClose={() => setUserModalOpen(false)}
                    isDirty={formDirty}
                  >
                    <UserForm
                      key={userModalOpen ? "user-new" : "user-closed"}
                      onSubmit={onCreateUser}
                      submitting={userSubmitting}
                      onCancel={() => setUserModalOpen(false)}
                      onDirtyChange={setFormDirty}
                    />
                  </Modal>
                  <Modal
                    open={inviteModalOpen}
                    title="Invite member"
                    description="Send an email invitation to join the organization."
                    onClose={() => { setInviteModalOpen(false); setInviteToken(null); }}
                    isDirty={formDirty && !inviteToken}
                  >
                    {inviteToken ? (
                      <div className="flex flex-col gap-3">
                        <p role="status" className="rounded-lg bg-slate-50 p-3 text-[13px] text-slate-700 break-all dark:bg-neutral-800/60 dark:text-neutral-300">
                          Share this one-time link:{" "}
                          <span className="font-mono">
                            /invite/accept?token={inviteToken}
                          </span>
                        </p>
                        <div>
                          <Button onClick={() => { setInviteModalOpen(false); setInviteToken(null); }}>
                            Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <InviteForm
                        key={inviteModalOpen ? "invite-new" : "invite-closed"}
                        onSubmit={onInvite}
                        submitting={inviteSubmitting}
                        onCancel={() => setInviteModalOpen(false)}
                        onDirtyChange={setFormDirty}
                      />
                    )}
                  </Modal>
                </>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function PendingInvitesCard({
  invites,
  onAction,
}: {
  invites: Invite[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  return (
    <Card title="Pending invitations">
      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-neutral-800">
        {invites.length === 0 ? (
          <li className="py-2 text-sm text-slate-400 dark:text-neutral-500">No pending invitations</li>
        ) : (
          invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-neutral-100">{invite.email}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {invite.role.replace(/_/g, " ")} · expires{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("en-GH")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction(() => revokeInvite(invite.id), "Revoke failed")}
              >
                Revoke
              </Button>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
