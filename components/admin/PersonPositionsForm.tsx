"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setPersonPositions } from "@/lib/admin/actions/positions";
import type { SelectOption } from "@/lib/admin/queries";
import { SubmitButton } from "./buttons";

/**
 * The positions a person is suited for, edited on their profile. Applying for or
 * being assigned to a job adds its position automatically; this sets the list by hand.
 */
export default function PersonPositionsForm({
  candidateId,
  options,
  selected,
}: {
  candidateId: string;
  options: SelectOption[];
  selected: string[];
}) {
  const [checked, setChecked] = useState(() => new Set(selected));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!options.length) {
    return (
      <p className="text-sm text-gray-2">
        No positions yet.{" "}
        <Link href="/admin/positions/new" className="font-medium text-ink hover:underline">
          Add one
        </Link>
        .
      </p>
    );
  }

  function toggle(id: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await setPersonPositions(candidateId, [...checked]);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Positions saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2" disabled={pending}>
        <legend className="sr-only">Positions</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-gray-3"
          >
            <input
              type="checkbox"
              name="positionId"
              value={option.value}
              checked={checked.has(option.value)}
              onChange={() => toggle(option.value)}
              className="size-4 accent-ink"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div>
        <SubmitButton disabled={pending}>Save positions</SubmitButton>
      </div>
    </form>
  );
}
