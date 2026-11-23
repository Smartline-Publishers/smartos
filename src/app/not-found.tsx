import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
