"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { retryCandidateProfileEmail } from "@/lib/admin/actions/candidates";
import { primaryButtonClass } from "./styles";

export default function RetryCandidateProfileEmailButton({ candidateId }: { candidateId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className={primaryButtonClass}
      onClick={() => startTransition(async () => {
        const result = await retryCandidateProfileEmail(candidateId);
        if (result.error) toast.error(result.error);
        else {
          toast.success("Candidate profile emailed to the client.");
          router.refresh();
        }
      })}
    >
      {pending ? "Sending…" : "Send profile email"}
    </button>
  );
}
