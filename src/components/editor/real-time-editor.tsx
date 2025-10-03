"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getRandomColor } from "@/lib/color";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  filterSuggestionItems,
} from "@blocknote/core";
import { Mention } from "./mentions";
import { getMentionMenuItems } from "@/lib/text-editor";
import { User } from "@/lib/db";

interface RealTimeEditorProps {
  token?: string;
  docId?: string;
  roomId?: string;
  userName?: string;
  entity?: { content: any } & Record<string, any>;
  saveHandler?: ((content: any) => Promise<void>) | null;
  saveHandlerTimeout?: number;
  mentionItems?: Array<User>;
  onChange?: (e: any) => void;
}

export default function RealTimeEditor({
  token = "",
  docId = "default",
  roomId = "",
  userName = "",
  entity = { content: "" },
  saveHandler = null,
  saveHandlerTimeout = 5000,
  onChange = () => {},
  mentionItems = [],
}: RealTimeEditorProps) {
  const doc = useMemo(() => new Y.Doc(), []);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const provider = useMemo(
    () =>
      new WebsocketProvider(
        `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?token=${btoa(token)}`,
        roomId,
        doc,
      ),
    [doc, roomId, token],
  );

  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      mention: Mention,
    },
  });

  const editor = useCreateBlockNote({
    schema,
    collaboration: {
      provider,
      fragment: doc.getXmlFragment(`document-store-${docId}`),
      user: {
        name: userName,
        color: getRandomColor(),
      },
      showCursorLabels: "activity",
    },
  });

  useEffect(() => {
    if (!editor || !entity?.content) return;

    editor.replaceBlocks(editor.document, entity.content);
  }, [editor, entity?.content]);

  useEffect(() => {
    if (!saveHandler || !editor) return;

    const handleSave = async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;
        const content = editor.document;
        await saveHandler(content);
      } catch (error) {
        console.error("Error saving document:", error);
      } finally {
        isSavingRef.current = false;
      }
    };

    const debouncedSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, saveHandlerTimeout);
    };

    const unsubscribe = editor.onChange(() => {
      debouncedSave();
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, saveHandler, saveHandlerTimeout]);

  useEffect(() => {
    return () => {
      provider.destroy();
    };
  }, [provider]);

  return (
    <BlockNoteView
      className="bg-white w-full p-4 max-w-full"
      editor={editor}
      data-color-scheme="light"
      onChange={onChange}
    >
      <>
        <SuggestionMenuController
          triggerCharacter={"@"}
          getItems={async (query) =>
            filterSuggestionItems(
              getMentionMenuItems(mentionItems, editor),
              query,
            )
          }
        />
      </>
    </BlockNoteView>
  );
}
