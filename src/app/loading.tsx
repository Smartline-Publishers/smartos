import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <p className="p-6">
      <Spinner label="Loading…" />
    </p>
  );
}
