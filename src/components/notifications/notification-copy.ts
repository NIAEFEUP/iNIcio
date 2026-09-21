import type { Notification } from "@/lib/db";

export type NotificationCopy = {
  title: string;
  description?: string;
  actionLabel?: string;
  href?: string;
};

function toData(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

/** Human-readable copy shared by the notification bell and the live toasts. */
export function getNotificationCopy(
  notification: Notification,
): NotificationCopy {
  const data = toData(notification.data);

  switch (notification.type) {
    case "phase_unlocked": {
      const phase = typeof data.phase === "string" ? data.phase : "";
      return {
        title: "Nova fase disponível",
        description: phase
          ? `A fase "${phase}" está agora disponível.`
          : "Uma nova fase está agora disponível.",
        actionLabel: "Ver progresso",
        href: "/candidate/progress",
      };
    }
    case "voting":
      return {
        title:
          data.result === "accepted"
            ? "Foste aceite no NIAEFEUP!"
            : "Resultado disponível",
        description: "Vê o resultado da tua candidatura.",
        actionLabel: "Ver resultado",
        href: "/candidate/progress",
      };
    case "mention":
      return {
        title: "Mencionaram-te num comentário",
        description: "Clica para veres os detalhes.",
      };
    default:
      return { title: "Nova notificação" };
  }
}

export function getNotificationToastType(
  notification: Notification,
): "success" | "info" | "warning" | "error" | undefined {
  switch (notification.type) {
    case "voting":
      return toData(notification.data).result === "accepted"
        ? "success"
        : "info";
    default:
      return "info";
  }
}
