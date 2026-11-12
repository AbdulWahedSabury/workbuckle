"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { playAlert } from "@/lib/admin/play-alert";

export type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  link: string | null;
  createdAt: string;
};

type AdminNotificationsContextValue = {
  notifications: AdminNotificationItem[];
  canMarkRead: boolean;
  markAllRead: () => Promise<void>;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

/** Pages whose server data a new notification (an application, a hire) can change. */
const LIVE_PAGES = [/^\/admin$/, /^\/admin\/candidates(\/|$)/, /^\/admin\/jobs$/, /^\/admin\/people(\/|$)/];
const showsLiveData = (pathname: string) => LIVE_PAGES.some((page) => page.test(pathname));

export function useAdminNotifications() {
  const ctx = use(AdminNotificationsContext);
  if (!ctx) throw new Error("useAdminNotifications must be used inside <AdminNotificationsProvider>");
  return ctx;
}

/**
 * Owns the one subscription to the admin notification stream. Mounted once
 * in AdminShell: the nav renders twice (sidebar + mobile drawer), and a
 * listener there would open two streams and play every alert twice.
 */
export default function AdminNotificationsProvider({
  canMarkRead,
  enabled = true,
  children,
}: {
  canMarkRead: boolean;
  /** False for roles that may not see the feed (client users): no stream is opened. */
  enabled?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  // Read inside the stream handler without reopening the stream on every navigation.
  const currentPath = useRef(pathname);
  // A notification arrived while the tab was hidden: refresh once when it is shown again.
  const refreshWhenVisible = useRef(false);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || !refreshWhenVisible.current) return;
      refreshWhenVisible.current = false;
      if (showsLiveData(currentPath.current)) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  // Ids already shown. null until the first payload, which only seeds it, so
  // opening the panel doesn't replay alerts for everything still unread.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource("/api/admin/notifications/stream");

    source.onmessage = (event) => {
      let unread: AdminNotificationItem[];
      try {
        unread = JSON.parse(event.data);
      } catch {
        return;
      }

      if (seen.current === null) {
        seen.current = new Set(unread.map((n) => n.id));
      } else {
        const fresh = unread.filter((n) => !seen.current!.has(n.id));
        if (fresh.length > 0) {
          playAlert("/sounds/alert.mp3", 0.4);
          for (const n of fresh) {
            seen.current.add(n.id);
            const tone = n.type.toLowerCase() as "info" | "success" | "warning" | "error";
            toast[tone](n.title, {
              id: n.id,
              description: n.message,
              duration: 8000,
              action: n.link ? { label: "View", onClick: () => router.push(n.link!) } : undefined,
            });
          }
          // New candidates should show up in open lists and the dashboard too: only on
          // pages that show them, and a hidden tab waits until it is looked at again.
          if (document.hidden) refreshWhenVisible.current = true;
          else if (showsLiveData(currentPath.current)) router.refresh();
        }
      }

      setNotifications(unread);
    };

    // EventSource reconnects on its own; `seen` survives, so nothing replays.
    return () => source.close();
  }, [router, enabled]);

  const markAllRead = async () => {
    setNotifications([]);
    try {
      await fetch("/api/admin/notifications/mark-read", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <AdminNotificationsContext value={{ notifications, canMarkRead, markAllRead }}>
      {children}
    </AdminNotificationsContext>
  );
}
