import {
  Control,
  Controller,
  FieldErrors,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import Label from './Label';

interface Props<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  control: Control<T>;
  errors: FieldErrors;
}

export function TextAreaField<T extends FieldValues>({
  name,
  label,
  placeholder,
  required = false,
  value,
  control,
  errors,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <Label htmlFor={name} required={required}>
            {label}
          </Label>
          <textarea
            id={name}
            placeholder={placeholder}
            aria-invalid={errors[name] ? 'true' : 'false'}
            aria-describedby={errors[name] ? `${name}-error"` : undefined}
            className="focus:border-primary/50 focus:ring-primary min-h-40 w-full rounded-xl bg-neutral-100 px-5 py-2.5 text-sm leading-4 font-medium ring-0 transition outline-none focus:ring-2"
            defaultValue={value}
            rows={4}
            {...field}
          />
          {errors[name] && (
            <p
              id={`${name}-error`}
              role="alert"
              className="text-xs text-red-600"
            >
              {errors[name].message as string}
            </p>
          )}
        </div>
      )}
    />
  );
}
