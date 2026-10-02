import { CheckCircle2 } from "lucide-react";

export interface ApplicationSuccessCardProps {
  firstName: string;
  onSubmitAnother: () => void;
}

/** Confirmation card shown after a successful application submission. */
export default function ApplicationSuccessCard({
  firstName,
  onSubmitAnother,
}: ApplicationSuccessCardProps) {
  return (
    <div className="rounded-card border border-line bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-10" />
      </div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Application Submitted!</h2>
      <p className="mt-3 text-sm text-gray-2 sm:text-base">
        Thank you, <span className="font-semibold text-ink">{firstName}</span>. Your application
        has been successfully sent to Manatal.
      </p>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onSubmitAnother}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
        >
          Submit Another Application
        </button>
      </div>
    </div>
  );
}
