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
import { useState } from "react";
import CommentMentionNotification from "./comment-mention-notification";
import { markNotificationAsRead } from "@/app/actions";

interface BaseNotificationProps {
  notification: Notification;
}

interface NotificationPopupProps {
  notifications: Notification[];
}

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
  const [unreadCount, setUnreadCount] = useState<number>(
    notifications.filter((n) => !n.isRead).length,
  );

  const markAllAsRead = () => {
    notifications.forEach((n) => markNotificationAsRead(n.id));
    setUnreadCount(0);
  };

  const markAsRead = (id: number) => {
    markNotificationAsRead(id);
    setUnreadCount((prev) => prev - 1);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
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
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sem notificações
            </div>
          ) : (
            notifications.map((notification) => {
              const Component = notificationComponents[notification.type];
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
