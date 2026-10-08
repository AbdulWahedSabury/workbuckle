import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors the public site's inputs (components/form/InputField.tsx): filled
// gray surface, rounded-xl, brand focus ring.
const inputClass =
  "h-12 w-full rounded-xl border border-transparent bg-gray-3 px-4 text-sm text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-gray-2/70 hover:border-ink/10 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15 aria-invalid:border-red-500 aria-invalid:bg-red-50/40";

type BaseProps = {
  name: string;
  label: string;
  error?: string[];
  hint?: React.ReactNode;
  required?: boolean;
};

function FieldShell({
  name,
  label,
  error,
  hint,
  required,
  children,
}: BaseProps & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </label>
      {children}
      {error?.length ? (
        <p id={`${name}-error`} role="alert" className="text-xs text-red-600">
          {error[0]}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-2">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  defaultValue,
  type = "text",
  placeholder,
  dir,
  autoComplete,
  ...base
}: BaseProps & {
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  dir?: string;
  autoComplete?: string;
}) {
  return (
    <FieldShell {...base}>
      <input
        id={base.name}
        name={base.name}
        type={type}
        dir={dir}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={base.required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={base.error?.length ? true : undefined}
        aria-describedby={base.error?.length ? `${base.name}-error` : undefined}
        className={inputClass}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  defaultValue,
  rows = 4,
  ...base
}: BaseProps & { defaultValue?: string | null; rows?: number }) {
  return (
    <FieldShell {...base}>
      <textarea
        id={base.name}
        name={base.name}
        rows={rows}
        required={base.required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={base.error?.length ? true : undefined}
        aria-describedby={base.error?.length ? `${base.name}-error` : undefined}
        className={cn(inputClass, "h-auto py-3")}
      />
    </FieldShell>
  );
}

export function SelectField({
  defaultValue,
  options,
  placeholder,
  ...base
}: BaseProps & {
  defaultValue?: string | null;
  options: readonly { value: string; label: string }[];
  /** Shown as an unselectable first option while nothing is chosen. */
  placeholder?: string;
}) {
  return (
    <FieldShell {...base}>
      <div className="relative">
        <select
          id={base.name}
          name={base.name}
          required={base.required}
          defaultValue={defaultValue ?? ""}
          aria-invalid={base.error?.length ? true : undefined}
          aria-describedby={base.error?.length ? `${base.name}-error` : undefined}
          className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-gray-2"
        />
      </div>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: React.ReactNode;
  defaultChecked?: boolean;
}) {
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-start gap-3 rounded-xl p-3 -m-3 transition-colors hover:bg-gray-3"
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-primary-dark"
      />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="text-xs text-gray-2">{hint}</span>}
      </span>
    </label>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      aria-live="polite"
      className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-ink"
    >
      {message}
    </p>
  );
}
