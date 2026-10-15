"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-10" role="alert">
      <Card title="Something went wrong">
        <p className="mb-3 text-sm text-slate-600 dark:text-neutral-400">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  );
}
