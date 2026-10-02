import type { ChangeEvent } from "react";
import type { LucideIcon } from "lucide-react";

export interface FormTextFieldProps {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "url";
  value: string;
  placeholder?: string;
  icon: LucideIcon;
  required?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
}

/** Labelled text input with a leading icon, reused across the application form. */
export default function FormTextField({
  name,
  label,
  type,
  value,
  placeholder,
  icon: Icon,
  required = false,
  autoComplete,
  onChange,
}: FormTextFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-2" aria-hidden="true" />
        <input
          id={name}
          type={type}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-line bg-gray-3/50 pl-10 pr-4 py-3 text-sm text-ink outline-none transition focus:border-ink focus:bg-white"
        />
      </div>
    </div>
  );
}
