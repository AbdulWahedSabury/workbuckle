"use client";

import { RotateCcw } from "lucide-react";
import { primaryButtonClass } from "@/components/admin/styles";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="max-w-xl rounded-sm-card border border-red-200 bg-white p-6 sm:p-8">
      <h1 className="text-xl text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-gray-2">
        The admin panel couldn&apos;t complete this request. Check that you are
        authorized and that the database is reachable (DATABASE_URL).
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-gray-2/80">Ref: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className={`${primaryButtonClass} mt-5`}>
        <RotateCcw aria-hidden="true" /> Try again
      </button>
    </div>
  );
}
