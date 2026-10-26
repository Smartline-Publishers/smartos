"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RoleGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MobileFab } from "@/components/ui/MobileFab";
import { EnvelopeSimple, UserPlus } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
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
  updateUser,
  type CreateUserInput,
  type OrgUser,
  type UpdateUserInput,
} from "@/features/users/api";
import { UserForm } from "@/features/users/UserForm";
import { UserEditForm } from "@/features/users/UserEditForm";
import { InviteForm } from "@/features/invites/InviteForm";
import { getCurrentOrg, type CurrentOrganization } from "@/features/organization/api";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";

export default function UsersPage() {
  const { user, session, permissions } = useAuth();
  const canManage = hasPermission(permissions, "users.read");
  const canEdit = hasPermission(permissions, "users.write");
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
  const [editing, setEditing] = useState<OrgUser | null>(null);
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
    if (canManage) void refresh();
    else setLoading(false);
  }, [refresh, canManage]);

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

  /**
   * Save a user's details or role. The role change is written server-side and
   * takes effect on that user's very next request — the API resolves their
   * live role from the database rather than trusting their token.
   */
  const onUpdateUser = async (target: OrgUser, values: UpdateUserInput) => {
    setUserSubmitting(true);
    setActionError(null);
    try {
      await updateUser(target.id, values);
      setEditing(null);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? `Could not update user: ${e.message}` : "Could not update user",
      );
    } finally {
      setUserSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Users"
            description="Staff accounts, seat usage, and pending invitations."
            hideActionsOnMobile
            actions={
              canEdit ? (
                <>
                  <Button variant="ghost" onClick={() => { setInviteToken(null); setInviteModalOpen(true); }}>
                    Invite member
                  </Button>
                  <Button onClick={() => setUserModalOpen(true)}>
                    Add user
                  </Button>
                </>
              ) : undefined
            }
          />
          {canEdit ? (
            <MobileFab
              menuLabel="User actions"
              actions={[
                {
                  label: "Add user",
                  icon: UserPlus,
                  onClick: () => setUserModalOpen(true),
                },
                {
                  label: "Invite member",
                  icon: EnvelopeSimple,
                  onClick: () => {
                    setInviteToken(null);
                    setInviteModalOpen(true);
                  },
                },
              ]}
            />
          ) : null}
          {!canManage ? (
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
                                <td className="px-4 py-2 text-xs text-slate-600 dark:text-neutral-400">
                                  <Badge status={u.role} />
                                </td>
                                <td className="px-4 py-2">
                                  <Badge status={u.active ? "ACTIVE" : "INACTIVE"} />
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {u.id === user?.id ? (
                                    <span className="text-xs text-slate-400 dark:text-neutral-500">You</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1">
                                      {canEdit ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditing(u);
                                            setFormDirty(false);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                      ) : null}
                                      {canEdit ? (
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
                                      ) : null}
                                    </span>
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
                      assignableRoles={session?.assignableRoles}
                      onSubmit={onCreateUser}
                      submitting={userSubmitting}
                      onCancel={() => setUserModalOpen(false)}
                      onDirtyChange={setFormDirty}
                    />
                  </Modal>
                  <Modal
                    open={editing !== null}
                    title="Edit user"
                    description="Update this person's details or change the role they hold."
                    onClose={() => { setEditing(null); setFormDirty(false); }}
                    isDirty={formDirty}
                  >
                    {editing ? (
                      <UserEditForm
                        key={editing.id}
                        user={editing}
                        assignableRoles={session?.assignableRoles}
                        onSubmit={(values) => onUpdateUser(editing, values)}
                        submitting={userSubmitting}
                        onCancel={() => { setEditing(null); setFormDirty(false); }}
                        onDirtyChange={setFormDirty}
                      />
                    ) : null}
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
      </RouteGuard>
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
