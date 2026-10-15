"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

function shortOrg(orgId: string | undefined): string {
  if (!orgId) return "No organization";
  return `Org ${orgId.slice(0, 8)}`;
}

interface AccountMenuPanelProps {
  onClose: () => void;
  /** Anchor positioning, e.g. "absolute bottom-full left-0 mb-2". */
  className?: string;
}

/**
 * Account dropdown panel. Anchored to the profile trigger by the caller via
 * `className`; overlays content without shifting layout. Closes on Escape;
 * callers dismiss it on outside click and after navigation.
 */
export function AccountMenuPanel({ onClose, className }: AccountMenuPanelProps) {
  const { user } = useAuth();
  const { profile } = useOrg();
  const router = useRouter();
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      role="menu"
      aria-label="Account"
      className={cn(
        "w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-sm font-bold text-white dark:bg-neutral-800"
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" aria-hidden="true" className="h-10 w-10 object-cover" />
          ) : (
            initial
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink dark:text-neutral-100">
            {user?.email ?? "Signed in"}
          </p>
          <p className="mt-0.5 text-xs text-muted dark:text-neutral-400">
            {shortOrg(user?.orgId)}
          </p>
        </div>
      </div>
      {user && user.roles.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {user.roles.map((role) => (
            <Badge key={role} status={role} />
          ))}
        </div>
      ) : null}
      <p className="mt-2.5 text-xs text-muted dark:text-neutral-400">
        Sign in with a different email to switch accounts.
      </p>
      <div className="mt-3 grid gap-2">
        <Button size="sm" onClick={() => go("/login")}>
          <Plus size={16} aria-hidden="true" />
          Add account
        </Button>
        <Button size="sm" variant="ghost" onClick={() => go("/profile")}>
          View profile
        </Button>
        <Button size="sm" variant="ghost" onClick={() => go("/settings")}>
          Settings
        </Button>
      </div>
    </div>
  );
}
