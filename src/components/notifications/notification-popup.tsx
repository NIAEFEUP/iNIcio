import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { Notification } from "@/lib/db";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import CommentMentionNotification from "./comment-mention-notification";
import DefaultNotification from "./default-notification";
import { NOTIFICATIONS_CHANGED_EVENT } from "./notification-live";
import { markNotificationAsRead } from "@/app/actions";

interface BaseNotificationProps {
  notification: Notification;
}

interface NotificationPopupProps {
  notifications: Notification[];
}

const hasCommentJoin = (notification: Notification) =>
  notification.type !== "mention" ||
  (notification as Notification & { comment?: unknown }).comment !== undefined;

const notificationComponents: Record<
  string,
  React.ComponentType<BaseNotificationProps>
> = {
  mention: (props) => (
    <CommentMentionNotification notification={props.notification} />
  ),
};

export default function NotificationPopup({
  notifications,
}: NotificationPopupProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [items, setItems] = useState<Notification[]>(notifications);
  const [prevNotifications, setPrevNotifications] =
    useState<Notification[]>(notifications);

  const unreadCount = items.filter((n) => !n.isRead).length;

  // Absorb revisions coming from the server (navigation) while keeping any
  // optimistic reads and live additions the server render does not know yet.
  if (prevNotifications !== notifications) {
    setPrevNotifications(notifications);
    setItems((prev) => {
      const merged = new Map<number, Notification>();
      for (const notification of notifications) {
        merged.set(notification.id, notification);
      }
      for (const notification of prev) {
        merged.set(notification.id, notification);
      }
      return [...merged.values()].sort((a, b) => b.id - a.id);
    });
  }

  // Live additions dispatched by the notification toaster.
  useEffect(() => {
    const handleChange = (event: Event) => {
      const fresh = (event as CustomEvent<Notification[]>).detail;
      const joinable = fresh.filter(hasCommentJoin);
      if (joinable.length === 0) return;

      setItems((prev) => {
        const merged = new Map<number, Notification>();
        for (const notification of prev) {
          merged.set(notification.id, notification);
        }
        for (const notification of joinable) {
          if (!merged.has(notification.id)) {
            merged.set(notification.id, notification);
          }
        }
        return [...merged.values()].sort((a, b) => b.id - a.id);
      });
    };

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChange);
    return () =>
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChange);
  }, []);

  const markAllAsRead = () => {
    items.forEach((n) => {
      void markNotificationAsRead(n.id);
    });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: number) => {
    void markNotificationAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-[0.01em] h-5 min-w-5 rounded-full px-1 text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sem notificações
            </div>
          ) : (
            items.map((notification) => {
              const Component =
                notificationComponents[notification.type] ??
                DefaultNotification;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "cursor-pointer px-4 py-3",
                    !notification.isRead && "bg-accent/50",
                  )}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Component notification={notification} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {/*formatTime(notification.createdAt)*/}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
