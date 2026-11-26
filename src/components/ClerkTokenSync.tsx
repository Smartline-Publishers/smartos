"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "@/lib/api-client";

export function ClerkTokenSync() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(isSignedIn ? (opts) => getToken(opts) : null);
    return () => setClerkTokenGetter(null);
  }, [getToken, isSignedIn]);
  return null;
}