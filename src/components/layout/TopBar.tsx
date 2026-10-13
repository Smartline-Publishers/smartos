"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <label htmlFor="org-switcher" className="sr-only">
          Organization
        </label>
        <select
          id="org-switcher"
          aria-label="Organization"
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
          defaultValue={user?.orgId ?? ""}
          title="Organization switcher (placeholder — multi-org switching not yet implemented)"
        >
          <option value={user?.orgId ?? ""}>
            {user ? `Org ${user.orgId.slice(0, 8)}` : "No organization"}
          </option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm text-slate-600" aria-live="polite">
            {user.email}
          </span>
        ) : null}
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
          Logout
        </Button>
      </div>
    </div>
  );
}
