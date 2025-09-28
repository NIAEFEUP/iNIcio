"use client";

import { useCreateBlockNote } from "@blocknote/react";

import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { Mention } from "./mentions";

export function ReadOnlyBlocks({ blocks }: { blocks: any[] }) {
  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      mention: Mention,
    },
  });

  const editor = useCreateBlockNote({
    schema,
    initialContent: blocks,
  });

  return (
    <BlockNoteView
      className="w-full [&_.bn-container]:w-full [&_.bn-container]:max-w-none"
      editor={editor}
      editable={false}
      data-color-scheme="light"
    />
  );
}
