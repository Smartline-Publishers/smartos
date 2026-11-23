"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/sign-in");
      } else if (!session?.organizationId) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }
  }, [loading, user, session, router]);

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </main>
    );
  }

  return null;
}
