"use client";

import { useCreateBlockNote } from "@blocknote/react";

import { BlockNoteView } from "@blocknote/mantine";

export function ReadOnlyBlocks({ blocks }: { blocks: any[] }) {
  const editor = useCreateBlockNote({ initialContent: blocks });

  return (
    <BlockNoteView
      className="w-full [&_.bn-container]:w-full [&_.bn-container]:max-w-none"
      editor={editor}
      editable={false}
      data-color-scheme="light"
    />
  );
}
