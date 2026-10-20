"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <Spinner label="Loading…" />
      </main>
    );
  }

  return null;
}
