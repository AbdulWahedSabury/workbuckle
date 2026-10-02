import type { ChangeEvent } from "react";

export interface FormTextAreaFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  onChange: (value: string) => void;
}

/** Labelled textarea styled to match {@link FormTextField}. */
export default function FormTextAreaField({
  name,
  label,
  value,
  placeholder,
  rows = 4,
  required = false,
  onChange,
}: FormTextAreaFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full resize-none rounded-xl border border-line bg-gray-3/50 p-4 text-sm text-ink outline-none transition focus:border-ink focus:bg-white"
      />
    </div>
  );
}
