"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { ROLE_OPTIONS } from "@/lib/auth/roles";
import type { Role } from "@/lib/generated/prisma/enums";
import { PASSWORD_MIN_LENGTH } from "@/schemas/AdminSchemas";
import { FormMessage, SelectField, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

export type UserFormValues = {
  email: string;
  name: string | null;
  role: Role;
};

const roleOptions = ROLE_OPTIONS.map((o) => ({
  value: o.value,
  label: `${o.label} — ${o.description}`,
}));

export default function UserForm({
  action,
  user,
  isSelf = false,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Omitted when creating; the password is then required. */
  user?: UserFormValues;
  /** Editing your own account: you can't take away your own admin role. */
  isSelf?: boolean;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Account</legend>
        <TextField
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="off"
          defaultValue={v ? v.email : user?.email}
          error={errors.email}
        />
        <TextField
          name="name"
          label="Name"
          autoComplete="off"
          defaultValue={v ? v.name : user?.name}
          error={errors.name}
        />
        <SelectField
          name="role"
          label="Role"
          required
          options={roleOptions}
          defaultValue={v ? v.role : (user?.role ?? "VIEWER")}
          hint={isSelf ? "You can't remove your own admin access." : undefined}
          error={errors.role}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>{user ? "Change password" : "Password"}</legend>
        <TextField
          name="password"
          label={user ? "New password" : "Password"}
          type="password"
          required={!user}
          autoComplete="new-password"
          hint={
            user
              ? "Leave blank to keep the current password."
              : `At least ${PASSWORD_MIN_LENGTH} characters. Share it with the user securely.`
          }
          error={errors.password}
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/users" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
