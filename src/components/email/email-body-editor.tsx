"use client";

import * as React from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

export interface EmailBodyEditorProps {
  /** Receives the BlockNote editor instance so the caller can read `editor.document` and export HTML. */
  editorRef?: React.MutableRefObject<any | null>;
  onChange?: (editor: any) => void;
}

/**
 * BlockNote schema restricted to the rich-text features that render reliably
 * in email clients (Gmail, Outlook, Apple Mail, ...):
 *
 *  - Blocks: paragraphs, headings, bullet/numbered lists, blockquote, code
 *    block, divider.
 *  - Inline: bold, italic, underline, strikethrough, inline code, text color
 *    and links (the default `text` + `link` specs).
 *
 * Deliberately excluded because email clients mangle them: tables, images,
 * audio/video/files, checklists, toggle lists and background colors.
 */
const emailSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    quote: defaultBlockSpecs.quote,
    codeBlock: defaultBlockSpecs.codeBlock,
    divider: defaultBlockSpecs.divider,
  },
  styleSpecs: {
    bold: defaultStyleSpecs.bold,
    italic: defaultStyleSpecs.italic,
    underline: defaultStyleSpecs.underline,
    strike: defaultStyleSpecs.strike,
    code: defaultStyleSpecs.code,
    textColor: defaultStyleSpecs.textColor,
  },
});

/**
 * Rich-text editor for the email body. Deliberately simpler than
 * `RealTimeEditor`: no collaboration, no mentions, no autosave — it just tracks
 * a BlockNote editor instance for the composer, restricted to email-safe
 * formatting.
 */
export default function EmailBodyEditor({
  editorRef,
  onChange,
}: EmailBodyEditorProps) {
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  const editor = useCreateBlockNote({ schema: emailSchema });

  React.useEffect(() => {
    if (editorRef) editorRef.current = editor;
    return () => {
      if (editorRef) editorRef.current = null;
    };
  }, [editor, editorRef]);

  return (
    <BlockNoteView
      theme={theme}
      className="h-full min-h-48 w-full rounded-lg border border-input bg-background px-2 py-2 text-base transition-colors outline-none overflow-y-auto break-words placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
      editor={editor}
      onChange={() => onChange?.(editor)}
    />
  );
}
