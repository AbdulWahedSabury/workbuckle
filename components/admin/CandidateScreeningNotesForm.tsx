"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCandidateScreeningNotes } from "@/lib/admin/actions/candidates";
import { inputClass } from "./fields";
import { SubmitButton } from "./buttons";

export default function CandidateScreeningNotesForm({ candidateId, initialNotes }: {
  candidateId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveCandidateScreeningNotes(candidateId, notes);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Pre-screening notes saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="screeningNotes" className="text-sm font-semibold text-ink">Pre-screening interview notes</label>
      <textarea
        id="screeningNotes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={7}
        maxLength={10_000}
        disabled={pending}
        placeholder="Summarize the interview, experience and role fit…"
        className={`${inputClass} h-auto min-h-40 py-3`}
      />
      <p className="text-xs text-gray-2">These notes are attached to the client email when the candidate is submitted.</p>
      <div><SubmitButton disabled={pending}>Save notes</SubmitButton></div>
    </form>
  );
}
