"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/use-auth";
import {
  CreateInviteSchema,
  createInvite,
  listInvites,
  revokeInvite,
  type CreateInviteInput,
  type Invite,
} from "@/features/invites/api";
import {
  CreateUserSchema,
  createUser,
  deleteUser,
  listUsers,
  type CreateUserInput,
  type OrgUser,
} from "@/features/users/api";
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

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Users"
            description="Staff accounts, seat usage, and pending invitations."
          />
          {!isAdmin ? (
            <EmptyState
              title="Restricted"
              description="Only organization and platform admins can view the user list."
            />
          ) : (
            <>
              {actionError ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
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
                    <p className="text-[13px] text-slate-600" aria-live="polite">
                      Plan <span className="font-semibold text-slate-900">{org.plan}</span> ·{" "}
                      <span className="font-semibold tabular-nums text-slate-900">
                        {data?.total ?? 0} of {org.limits.maxUsers}
                      </span>{" "}
                      seats used
                    </p>
                  ) : null}
                  {!data || data.items.length === 0 ? (
                    <EmptyState title="No users" description="Invite the first team member below." />
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white">
                        <table className="w-full border-collapse text-left text-sm">
                          <caption className="sr-only">Organization users</caption>
                          <thead className="bg-slate-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700">Name</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700">Email</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700">Role</th>
                              <th scope="col" className="px-4 py-2 font-semibold text-slate-700">Status</th>
                              <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.items.map((u) => (
                              <tr key={u.id} className="border-t border-slate-200">
                                <td className="px-4 py-2 font-medium text-slate-900">{u.fullName}</td>
                                <td className="px-4 py-2 text-slate-700">{u.email}</td>
                                <td className="px-4 py-2 text-xs text-slate-600">{u.role.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2">
                                  <Badge status={u.active ? "ACTIVE" : "INACTIVE"} />
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {u.id !== user?.id ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-700 hover:bg-red-50"
                                      onClick={() => {
                                        if (window.confirm(`Remove ${u.email}?`)) {
                                          void runAction(() => deleteUser(u.id), "Remove failed");
                                        }
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-slate-400">You</span>
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
                    <NewUserCard onAction={runAction} />
                    <InviteCard
                      invites={invites}
                      inviteToken={inviteToken}
                      onAction={runAction}
                      onToken={setInviteToken}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function NewUserCard({
  onAction,
}: {
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { email: "", password: "", fullName: "", role: "VIEWER" },
  });

  return (
    <Card title="Add user directly">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await createUser(v);
            reset();
          }, "Could not create user");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Add user form"
      >
        <Input label="Full name" required error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Temporary password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select
          label="Role"
          error={errors.role?.message}
          options={[
            { value: "VIEWER", label: "Viewer" },
            { value: "AUTHOR", label: "Author" },
            { value: "EDITOR", label: "Editor" },
            { value: "DESIGNER", label: "Designer" },
            { value: "PRODUCTION", label: "Production" },
            { value: "WAREHOUSE", label: "Warehouse" },
            { value: "SALES", label: "Sales" },
            { value: "FINANCE", label: "Finance" },
            { value: "ORG_ADMIN", label: "Org admin" },
          ]}
          {...register("role")}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add user"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function InviteCard({
  invites,
  inviteToken,
  onAction,
  onToken,
}: {
  invites: Invite[];
  inviteToken: string | null;
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
  onToken: (token: string | null) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInviteInput>({
    resolver: zodResolver(CreateInviteSchema),
    defaultValues: { email: "", role: "VIEWER", daysValid: 7 },
  });

  return (
    <Card title="Invite by email">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            const created = await createInvite(v);
            onToken(created.token ?? null);
            reset();
          }, "Could not create invite");
        })}
        className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"
        aria-label="Invite user form"
      >
        <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
        <Select
          label="Role"
          error={errors.role?.message}
          options={[
            { value: "VIEWER", label: "Viewer" },
            { value: "AUTHOR", label: "Author" },
            { value: "EDITOR", label: "Editor" },
            { value: "DESIGNER", label: "Designer" },
            { value: "PRODUCTION", label: "Production" },
            { value: "WAREHOUSE", label: "Warehouse" },
            { value: "SALES", label: "Sales" },
            { value: "FINANCE", label: "Finance" },
            { value: "ORG_ADMIN", label: "Org admin" },
          ]}
          {...register("role")}
        />
        <div className="flex items-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Inviting…" : "Invite"}
          </Button>
        </div>
      </form>
      {inviteToken ? (
        <p role="status" className="mt-3 rounded-lg bg-slate-50 p-3 text-[13px] text-slate-700 break-all">
          Share this one-time link:{" "}
          <span className="font-mono">
            /invite/accept?token={inviteToken}
          </span>
        </p>
      ) : null}
      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {invites.length === 0 ? (
          <li className="py-2 text-sm text-slate-400">No pending invitations</li>
        ) : (
          invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{invite.email}</p>
                <p className="text-xs text-slate-500">
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
