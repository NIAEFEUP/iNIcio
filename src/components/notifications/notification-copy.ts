import type { Notification } from "@/lib/db";
import { getDateStringPT, getTimeString } from "@/lib/date";

export type NotificationCopy = {
  title: string;
  description?: string;
  actionLabel?: string;
  href?: string;
};

function toData(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

function describeRescheduled(
  singular: string,
  data: Record<string, unknown>,
): string {
  const oldStart = typeof data.oldStart === "string" ? data.oldStart : null;
  const newStart = typeof data.newStart === "string" ? data.newStart : null;

  if (!newStart) {
    return `A tua ${singular} foi reagendada. Consulta o progresso para veres o novo horário.`;
  }

  const formatSlot = (start: string) => {
    const date = new Date(start);
    return `${getDateStringPT(date)} às ${getTimeString(date)}`;
  };

  return oldStart
    ? `A tua ${singular} mudou de ${formatSlot(oldStart)} para ${formatSlot(newStart)}.`
    : `A tua ${singular} foi marcada para ${formatSlot(newStart)}.`;
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
    case "interviewer_unassigned": {
      const recruiterName =
        typeof data.recruiterName === "string" && data.recruiterName
          ? data.recruiterName
          : "Um recrutador";
      const count =
        typeof data.count === "number" && data.count > 0 ? data.count : 1;
      return {
        title: "Recrutador desatribuído",
        description: `${recruiterName} deixou de estar disponível para ${count} ${
          count === 1 ? "sessão" : "sessões"
        }. Confirma as marcações.`,
        actionLabel: "Ver marcações",
        href: "/admin/bookings",
      };
    }
    case "interview_rescheduled":
      return {
        title: "Entrevista reagendada pela equipa",
        description: describeRescheduled("entrevista", data),
        actionLabel: "Ver progresso",
        href: "/candidate/progress",
      };
    case "dynamic_rescheduled":
      return {
        title: "Dinâmica reagendada pela equipa",
        description: describeRescheduled("dinâmica", data),
        actionLabel: "Ver progresso",
        href: "/candidate/progress",
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
    case "interviewer_unassigned":
      return "warning";
    default:
      return "info";
  }
}
