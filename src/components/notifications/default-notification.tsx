import { Notification } from "@/lib/db";
import { Bell } from "lucide-react";
import { getNotificationCopy } from "./notification-copy";

interface DefaultNotificationProps {
  notification: Notification;
}

export default function DefaultNotification({
  notification,
}: DefaultNotificationProps) {
  const copy = getNotificationCopy(notification);

  return (
    <div className="flex w-full items-start gap-3">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {copy.title}
        </p>
        {copy.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {copy.description}
          </p>
        )}
      </div>
    </div>
  );
}
