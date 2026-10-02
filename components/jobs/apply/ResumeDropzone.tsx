import { useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";

export interface ResumeDropzoneProps {
  label: string;
  resume: File | null;
  accept: string;
  hint: string;
  required?: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

/** Drag-and-drop (or click-to-browse) resume upload field. Owns its own drag-hover state. */
export default function ResumeDropzone({
  label,
  resume,
  accept,
  hint,
  required = false,
  onFileSelect,
  onClear,
}: ResumeDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragActive
            ? "border-ink bg-gray-3"
            : resume
            ? "border-emerald-500 bg-emerald-50/50"
            : "border-line bg-gray-3/30 hover:bg-gray-3/60"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {resume ? (
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-emerald-700">
            <FileText className="size-5 text-emerald-600" />
            <span>{resume.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="rounded-full p-1 text-emerald-800 hover:bg-emerald-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto mb-2 size-7 text-gray-2" />
            <p className="text-sm font-semibold text-ink">
              Drag &amp; drop your resume here, or{" "}
              <span className="underline decoration-ink underline-offset-2">browse files</span>
            </p>
            <p className="mt-1 text-xs text-gray-2">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
