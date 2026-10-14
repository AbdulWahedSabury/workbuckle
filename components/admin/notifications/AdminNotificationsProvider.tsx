"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  markAllRead: () => Promise<void>;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

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
export default function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  // Ids already shown. null until the first payload, which only seeds it, so
  // opening the panel doesn't replay alerts for everything still unread.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
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
          // New candidates should show up in open lists/dashboards too.
          router.refresh();
        }
      }

      setNotifications(unread);
    };

    // EventSource reconnects on its own; `seen` survives, so nothing replays.
    return () => source.close();
  }, [router]);

  const markAllRead = async () => {
    setNotifications([]);
    try {
      await fetch("/api/admin/notifications/mark-read", { method: "POST" });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <AdminNotificationsContext value={{ notifications, markAllRead }}>
      {children}
    </AdminNotificationsContext>
  );
}
