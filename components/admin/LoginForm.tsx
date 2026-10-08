"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/admin/action-state";
import { adminSignIn } from "@/lib/admin/actions/auth";
import { FormMessage, TextField } from "./fields";
import { SubmitButton } from "./buttons";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(adminSignIn, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormMessage message={state.message} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/admin"} />
      <TextField
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="username"
        defaultValue={state.values?.email}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
