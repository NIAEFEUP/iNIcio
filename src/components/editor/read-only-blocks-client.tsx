"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Mention } from "./mentions";

const emptySubscribe = () => () => {};

export function ReadOnlyBlocksClient({ blocks }: { blocks: any[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const editorTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

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

  useEffect(() => {
    editor.replaceBlocks(editor.topLevelBlocks, blocks);
  }, [blocks, editor]);

  return (
    <BlockNoteView
      theme={editorTheme}
      className="w-full [&_.bn-container]:w-full [&_.bn-container]:max-w-none [&_.bn-container]:bg-transparent"
      editor={editor}
      editable={false}
    />
  );
}
