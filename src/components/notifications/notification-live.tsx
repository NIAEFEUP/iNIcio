"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { pollNotifications, markNotificationAsRead } from "@/app/actions";
import { toast } from "@/components/ui/toast";
import {
  getNotificationCopy,
  getNotificationToastType,
} from "./notification-copy";
import { useSession } from "@/lib/use-session";
import type { Notification } from "@/lib/db";

const POLL_INTERVAL_MS = 15_000;

export const NOTIFICATIONS_CHANGED_EVENT = "inicio:notifications-changed";

export interface NotificationLiveProps {
  /** Highest id among the notifications rendered server-side. */
  initialMaxId?: number;
}

/**
 * Polls for new notifications and surfaces them as toasts using the toast
 * component. Also dispatches a `NOTIFICATIONS_CHANGED_EVENT` with the new
 * rows so the bell can stay in sync.
 */
export function NotificationLive({ initialMaxId = 0 }: NotificationLiveProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const lastSeenRef = useRef(initialMaxId);

  // After navigation the server re-renders with a newer snapshot; absorb the
  // higher watermark so already-surfaced notifications are not toasted again.
  useEffect(() => {
    lastSeenRef.current = Math.max(lastSeenRef.current, initialMaxId);
  }, [initialMaxId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
      try {
        const fresh = await pollNotifications(lastSeenRef.current);
        if (cancelled || fresh.length === 0) return;

        for (const notificationRow of fresh) {
          const copy = getNotificationCopy(notificationRow);
          const actionProps = copy.href
            ? {
                children: copy.actionLabel ?? "Ver",
                onClick: () => {
                  void markNotificationAsRead(notificationRow.id);
                  router.push(copy.href!);
                },
              }
            : undefined;

          toast.add({
            type: getNotificationToastType(notificationRow),
            title: copy.title,
            description: copy.description,
            timeout: 6000,
            actionProps,
          });

          lastSeenRef.current = Math.max(
            lastSeenRef.current,
            notificationRow.id,
          );
        }

        window.dispatchEvent(
          new CustomEvent<Notification[]>(NOTIFICATIONS_CHANGED_EVENT, {
            detail: fresh,
          }),
        );
      } catch (error) {
        console.error("Falha ao verificar notificações:", error);
      }
    };

    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    void check();
    interval = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, router]);

  return null;
}
