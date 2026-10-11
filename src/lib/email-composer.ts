/**
 * Client-safe constants and helpers for the "Enviar emails" composer. Kept free
 * of any Drizzle/`db` import so client components can pull from it directly.
 */

/**
 * Quick-send audiences. Each one maps to a set of candidate recipients that can
 * be selected in one click from the "Enviar emails" modal.
 */
export const EMAIL_TEMPLATE_TYPES = [
  "all",
  "accepted",
  "rejected",
  "not_applied",
  "no_interview",
  "no_dynamic",
  "no_scheduling",
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

/** Name of each audience, shown in the quick-send selector. */
export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  all: "Todos os candidatos",
  accepted: "Candidatos aceites",
  rejected: "Candidatos rejeitados",
  not_applied: "Não candidataram este ano",
  no_interview: "Sem entrevista marcada",
  no_dynamic: "Sem dinâmica marcada",
  no_scheduling: "Sem entrevista nem dinâmica",
};

/**
 * Base UI renders the raw `value` in `SelectValue` unless the root gets an
 * `items` map, so the selector needs this to display the audience name.
 */
export const EMAIL_TEMPLATE_ITEMS: Record<EmailTemplateType, string> =
  Object.fromEntries(
    EMAIL_TEMPLATE_TYPES.map((type) => [type, EMAIL_TEMPLATE_LABELS[type]]),
  ) as Record<EmailTemplateType, string>;

/** Above this length browsers/Gmail start truncating the compose URL. */
export const GMAIL_URL_LENGTH_WARNING = 8000;

/** Builds a Gmail web compose URL with the recipients hidden in BCC. */
export function buildGmailComposeUrl({
  recipients,
  subject,
  body,
}: {
  recipients: string[];
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({ view: "cm", fs: "1" });

  const emails = recipients.map((email) => email.trim()).filter(Boolean);
  if (emails.length > 0) params.set("bcc", emails.join(","));
  if (subject.trim()) params.set("su", subject.trim());
  if (body.trim()) params.set("body", body);

  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Flattens the text content of a BlockNote inline content node. */
function inlineContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      const node = item as {
        type?: string;
        text?: string;
        props?: { userName?: string };
      };
      if (node.type === "text") return node.text ?? "";
      if (node.type === "mention") return `@${node.props?.userName ?? ""}`;
      return "";
    })
    .join("");
}

/**
 * Best-effort plain-text version of BlockNote blocks, used for the Gmail
 * compose URL (Gmail only understands plain text in the `body` param).
 */
export function blocksToPlainText(blocks: unknown[]): string {
  const lines: string[] = [];

  const walk = (
    items: Array<{
      type?: string;
      content?: unknown;
      children?: unknown[];
    }>,
    depth: number,
  ) => {
    for (const block of items) {
      if (!block || typeof block !== "object") continue;

      const text = inlineContentToText(block.content);
      const indent = "  ".repeat(depth);

      if (block.type === "bulletListItem") lines.push(`${indent}• ${text}`);
      else if (block.type === "numberedListItem")
        lines.push(`${indent}1. ${text}`);
      else if (block.type === "checkListItem")
        lines.push(`${indent}[ ] ${text}`);
      else lines.push(`${indent}${text}`);

      if (Array.isArray(block.children)) walk(block.children, depth + 1);
    }
  };

  walk(
    blocks as Array<{ type?: string; content?: unknown; children?: unknown[] }>,
    0,
  );
  return lines.join("\n");
}

/**
 * Block types that render reliably in email clients. Everything else (images,
 * tables, files, audio/video, checklists, toggle lists) is filtered out when a
 * final-message template is inserted into the email body.
 */
export const EMAIL_SAFE_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "quote",
  "codeBlock",
  "divider",
]);

/** Whether a block's content is plain inline text (safe to lift into a paragraph). */
function isInlineContent(content: unknown): boolean {
  if (typeof content === "string") return true;
  if (!Array.isArray(content)) return false;

  return content.every((item) => {
    if (typeof item === "string") return true;
    if (!item || typeof item !== "object") return false;
    const type = (item as { type?: string }).type as string | undefined;
    return type === "text" || type === "link" || type === "mention";
  });
}

/**
 * Prepares template blocks for insertion into the email editor: drops the
 * stored block ids (they may collide with editor blocks), replaces any
 * `mention` inline nodes with plain `@name` text, and keeps only block types
 * the email-safe editor schema supports (unsupported blocks become paragraphs
 * with their text or are dropped).
 */
export function normalizeEmailBlocks(blocks: unknown[]): unknown[] {
  const normalizeInline = (content: unknown): unknown => {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return content;

    return content.map((item) => {
      if (
        item &&
        typeof item === "object" &&
        (item as { type?: string }).type === "mention"
      ) {
        const name =
          (item as { props?: { userName?: string } }).props?.userName ?? "";
        return { type: "text", text: `@${name}`, styles: {} };
      }
      return item;
    });
  };

  const walk = (items: unknown[]): unknown[] =>
    items.flatMap((block): unknown[] => {
      const value = block as {
        type?: string;
        content?: unknown;
        children?: unknown[];
      };

      if (
        !value ||
        typeof value !== "object" ||
        typeof value.type !== "string"
      ) {
        return [];
      }

      // Unsupported block: turn it into a paragraph when it holds inline text.
      if (!EMAIL_SAFE_BLOCK_TYPES.has(value.type)) {
        if (isInlineContent(value.content)) {
          return [
            {
              type: "paragraph",
              content: normalizeInline(value.content),
              children: Array.isArray(value.children)
                ? walk(value.children)
                : [],
            },
          ];
        }
        return [];
      }

      return [
        {
          ...(value as Record<string, unknown>),
          id: undefined,
          ...(value.content !== undefined
            ? { content: normalizeInline(value.content) }
            : {}),
          children: Array.isArray(value.children) ? walk(value.children) : [],
        },
      ];
    });

  return walk(blocks);
}
