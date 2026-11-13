"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"; // or "react-hot-toast"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContactFormType,
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  getContactFormSchema,
} from "@/schemas/ContactFormSchema";
import CaptchaWidget, { type CaptchaHandle } from "@/components/form/CaptchaWidget";
import { InputField } from "@/components/form/InputField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { Button } from "@/components/ui/button";
import { CAPTCHA_ENABLED, CAPTCHA_FIELD } from "@/lib/captcha/config";

export default function ContactForm() {
  const f = useTranslations("form");
  const c = useTranslations("pages.contact.form");
  const FormSchema = getContactFormSchema(f);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  // Anti-spam: the honeypot is uncontrolled so it stays out of the form state,
  // and the start time is set after mount (not during render) to keep render pure.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);
  useEffect(() => {
    startedAtRef.current = performance.now();
  }, []);

  const captchaRef = useRef<CaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const onSubmit = async (data: ContactFormType) => {
    if (CAPTCHA_ENABLED && !captchaToken) {
      toast.error(f("captcha_failed"));
      return;
    }
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
          [ELAPSED_FIELD]: Math.round(performance.now() - startedAtRef.current),
          [CAPTCHA_FIELD]: captchaToken ?? "",
        }),
      });
      // The token is spent whatever the answer was.
      captchaRef.current?.reset();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(f("too_many_requests"));
        } else if (res.status === 422) {
          toast.error(f("submit_too_fast"));
        } else if (res.status === 403) {
          toast.error(f("captcha_failed"));
        } else {
          toast.error(f("submit_faild"));
        }
        return;
      }

      const result = await res.json();

      if (!result.success) {
        toast.error(f("submit_faild"));
        return;
      }

      toast.success(f("submit_success"));
      reset();
      startedAtRef.current = performance.now();
    } catch {
      toast.error(f("error_occured"));
    }
  };

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      // Clears the sticky header and the heading above the form on #contact-form jumps.
      className="scroll-mt-44 space-y-6 lg:scroll-mt-48"
      aria-describedby="contact-form"
    >
      {/* Honeypot: moved off-screen rather than display:none, since some bots skip
          display:none fields. Hidden from screen readers and the tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>{c("honeypot")}</label>
        <input
          ref={honeypotRef}
          type="text"
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          // Keep password managers (1Password, LastPass, Dashlane) from filling it.
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          defaultValue=""
        />
      </div>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <InputField
          type="text"
          name="first_name"
          label={f("first_name.label")}
          placeholder={f("first_name.placeholder")}
          required
          errors={errors}
          control={control}
        />

        <InputField
          type="text"
          name="last_name"
          label={f("last_name.label")}
          placeholder={f("last_name.placeholder")}
          required
          errors={errors}
          control={control}
        />

        <InputField
          type="email"
          name="email"
          label={f("email.label")}
          placeholder={f("email.placeholder")}
          required
          errors={errors}
          control={control}
        />

        <InputField
          type="tel"
          name="phone"
          label={f("phone.label")}
          placeholder={f("phone.placeholder")}
          required
          errors={errors}
          control={control}
        />
      </div>

      <TextAreaField
        label={f("message.label")}
        name="message"
        placeholder={f("message.placeholder")}
        required
        errors={errors}
        control={control}
      />

      <CaptchaWidget ref={captchaRef} onToken={setCaptchaToken} />

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? f("processing") : f("btn")}
        </Button>
      </div>
    </form>
  );
}
