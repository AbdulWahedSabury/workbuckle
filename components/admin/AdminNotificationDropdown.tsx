"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Check, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconButtonClass } from "./styles";
import {
  useAdminNotifications,
  type AdminNotificationItem,
} from "./notifications/AdminNotificationsProvider";

const ICONS: Record<AdminNotificationItem["type"], React.ReactNode> = {
  SUCCESS: <CheckCircle className="size-4 text-emerald-500" />,
  WARNING: <AlertTriangle className="size-4 text-amber-500" />,
  ERROR: <XCircle className="size-4 text-rose-500" />,
  INFO: <Info className="size-4 text-blue-500" />,
};

/**
 * Bell + list of unread notifications. Only renders state: the stream, sound
 * and toasts live in AdminNotificationsProvider, so this can appear in both
 * the sidebar and the mobile top bar.
 */
export default function AdminNotificationDropdown({ align = "right" }: { align?: "left" | "right" }) {
  const { notifications, markAllRead } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const count = notifications.length;
  const close = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={count > 0 ? `Notifications (${count} unread)` : "Notifications"}
        aria-expanded={isOpen}
        className={cn(iconButtonClass, "relative size-10 [&_svg]:size-5")}
      >
        <Bell aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Click outside to close. */}
          <div className="fixed inset-0 z-40" onClick={close} />

          <div
            className={cn(
              "absolute z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-sm-card border border-line bg-white shadow-xl",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <h3 className="text-sm font-semibold text-ink">Notifications</h3>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    void markAllRead();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-dark hover:text-ink"
                >
                  <Check aria-hidden="true" className="size-3" /> Mark all read
                </button>
              )}
            </div>

            <ul className="max-h-72 divide-y divide-line overflow-y-auto">
              {count === 0 ? (
                <li className="p-6 text-center text-sm text-gray-2">You&apos;re all caught up.</li>
              ) : (
                notifications.map((n) => {
                  const body = (
                    <>
                      <span className="mt-0.5 shrink-0">{ICONS[n.type]}</span>
                      <span className="space-y-0.5">
                        <span className="block text-xs font-semibold text-ink">{n.title}</span>
                        <span className="block text-xs leading-relaxed text-gray-2">{n.message}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link href={n.link} onClick={close} className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-3">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 p-4">{body}</div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
