import React, { LabelHTMLAttributes } from 'react';

interface Props extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children?: React.ReactNode;
}

export default function Label({ required = false, children }: Props) {
  return (
    <label className="mb-1.5 block text-base font-normal text-neutral-950 capitalize">
      {children} {required && <span className="text-red-600">*</span>}
    </label>
  );
}
