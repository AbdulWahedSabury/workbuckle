"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { FieldShell, type BaseProps } from "./fields";

/**
 * File input with a live preview. The current image travels in a hidden
 * `existingName` input so the action can keep it when no new file is chosen.
 */
export default function ImageUploadField({
  existingName,
  existingUrl,
  disabled,
  ...base
}: BaseProps & {
  /** Name of the hidden input carrying the current image URL. */
  existingName: string;
  existingUrl?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Release the object URL when it's replaced or the field unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // React resets the form after an action runs, which clears the file input;
  // drop the preview with it so it never shows a file that won't be sent.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setPreview(null);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  }

  function clearSelection() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
  }

  const shown = preview ?? existingUrl;

  return (
    <FieldShell
      {...base}
      hint={base.hint ?? (preview ? "New image — saved when you submit." : "PNG, JPG, WebP, GIF, AVIF or SVG, up to 4 MB.")}
    >
      <input type="hidden" name={existingName} value={existingUrl ?? ""} />
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-gray-3">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Preview" className="size-full object-contain p-1" />
          ) : (
            <ImageIcon className="size-8 text-gray-2" aria-hidden="true" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <input
            ref={inputRef}
            id={base.name}
            name={base.name}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            disabled={disabled}
            onChange={onChange}
            aria-invalid={base.error?.length ? true : undefined}
            aria-describedby={base.error?.length ? `${base.name}-error` : undefined}
            className="w-full text-sm text-gray-2 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-primary/20"
          />
          {preview && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-gray-2 underline-offset-2 hover:text-ink hover:underline"
            >
              {existingUrl ? "Keep current image" : "Remove"}
            </button>
          )}
        </div>
      </div>
    </FieldShell>
  );
}
