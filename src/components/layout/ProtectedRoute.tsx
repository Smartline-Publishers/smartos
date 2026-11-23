"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
        <Skeleton width="12rem" height="1.5rem" rounded="lg" />
        <Skeleton width="8rem" height="0.875rem" rounded="sm" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
