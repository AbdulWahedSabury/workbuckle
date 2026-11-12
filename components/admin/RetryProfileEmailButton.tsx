"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { retryApplicationProfileEmail } from "@/lib/admin/actions/applications";
import { primaryButtonClass } from "./styles";

export default function RetryProfileEmailButton({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className={primaryButtonClass}
      onClick={() => startTransition(async () => {
        const result = await retryApplicationProfileEmail(applicationId);
        if (result.error) toast.error(result.error);
        else {
          if (result.notice) toast.warning(result.notice);
          toast.success("Candidate profile emailed to the client.");
          router.refresh();
        }
      })}
    >
      {pending ? "Sending…" : "Send profile email"}
    </button>
  );
}
