// Client-safe: imported by admin form components as well as Server Actions.

/** Result returned by admin Server Actions to `useActionState`. */
export type ActionState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Submitted values, echoed back so the form keeps them after a failed submit. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = {};
