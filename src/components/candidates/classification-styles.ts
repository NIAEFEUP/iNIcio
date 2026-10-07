const textStyles: Record<string, string> = {
  "muito fraco": "text-red-600 dark:text-red-400",
  normal: "text-amber-600 dark:text-amber-400",
  "muito forte": "text-emerald-600 dark:text-emerald-400",
};

const badgeStyles: Record<string, string> = {
  "muito fraco":
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  normal:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  "muito forte":
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
};

export type ClassificationLevel = keyof typeof textStyles;

export function classificationLabel(
  level: string | null | undefined,
): string | null {
  switch (level) {
    case "muito fraco":
      return "Muito fraco";
    case "normal":
      return "Normal";
    case "muito forte":
      return "Muito forte";
    default:
      return null;
  }
}

export function classificationTextClass(level: string | null | undefined) {
  return textStyles[level ?? ""] ?? "text-muted-foreground";
}

export function classificationBadgeClass(level: string | null | undefined) {
  return badgeStyles[level ?? ""] ?? "";
}
