import { Notification } from "@/lib/db";
import { Bell } from "lucide-react";

interface DefaultNotificationProps {
  notification: Notification;
}

export default function DefaultNotification({
  notification,
}: DefaultNotificationProps) {
  const data = (notification.data ?? {}) as Record<string, unknown>;

  const getMessage = () => {
    switch (notification.type) {
      case "phase_unlocked":
        return typeof data.phase === "string"
          ? `A fase "${data.phase}" está agora disponível.`
          : "Uma nova fase está agora disponível.";
      case "voting":
        if (data.result === "accepted") {
          return "Foste aceite! Vê o resultado da tua candidatura.";
        }
        if (data.result === "rejected") {
          return "Vê o resultado da tua candidatura.";
        }
        return "Há novidades na votação.";
      case "mention":
        return "Mencionaram-te num comentário.";
      default:
        return "Nova notificação.";
    }
  };

  return (
    <div className="flex w-full items-start gap-3">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-sm font-medium leading-relaxed text-foreground">
        {getMessage()}
      </p>
    </div>
  );
}
