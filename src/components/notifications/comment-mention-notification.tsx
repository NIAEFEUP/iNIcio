"use client";

import { markNotificationAsRead } from "@/app/actions";
import { Card } from "@/components/ui/card";

import {
  Application,
  ApplicationComment,
  Candidate,
  Notification,
} from "@/lib/db";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

import { useRouter } from "next/navigation";

export type CommentMentionNotification = Omit<Notification, "data"> & {
  type: "mention";
  data: {
    commentType: "application";
    commentId: number;
  };
  comment: ApplicationComment & {
    application: Application & { candidate: Candidate };
  };
};

interface CommentMentionNotificationProps {
  notification: Notification;
}

export default function CommentMentionNotification({
  notification,
}: CommentMentionNotificationProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        markNotificationAsRead(notification.id);
        router.push(
          `/candidate/${(notification as CommentMentionNotification).comment.application.candidate.userId}`,
        );
      }}
      className="block"
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
          !notification.isRead && "border-l-4 border-l-destructive",
        )}
      >
        <div className="flex items-start gap-4 p-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-accent">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-relaxed text-foreground">
              Mencionaram-te na candidatura de{" "}
              <span className="font-semibold">
                {
                  (notification as CommentMentionNotification).comment
                    .application.fullName
                }
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Clica para ver os detalhes
            </p>
          </div>

          {!notification.isRead && (
            <div className="flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-destructive" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
