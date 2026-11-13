"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import Script from "next/script";
import { useLocale } from "next-intl";
import { CAPTCHA_ENABLED, CAPTCHA_SITE_KEY } from "@/lib/captcha/config";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileOptions = {
  sitekey: string;
  language: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type CaptchaHandle = {
  /** A token works once: call after every submit attempt to get a fresh one. */
  reset: () => void;
};

/**
 * Cloudflare Turnstile check. Reports the token through `onToken` (null while
 * there is none: not solved yet, expired, or failed). Renders nothing while
 * captcha is off (lib/captcha/config.ts).
 */
export default function CaptchaWidget({
  onToken,
  ref,
}: {
  onToken: (token: string | null) => void;
  ref?: Ref<CaptchaHandle>;
}) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current !== null || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: CAPTCHA_SITE_KEY,
      language: locale,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }, [locale]);

  // The script may already be loaded (another form, or a client navigation back to this page).
  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current === null) return;
      window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        onTokenRef.current(null);
        if (widgetIdRef.current !== null) window.turnstile?.reset(widgetIdRef.current);
      },
    }),
    [],
  );

  if (!CAPTCHA_ENABLED) return null;
  return (
    <>
      <Script src={TURNSTILE_SCRIPT} strategy="afterInteractive" onReady={renderWidget} />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
