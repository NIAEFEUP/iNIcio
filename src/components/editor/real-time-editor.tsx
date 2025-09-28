"use client";

import React, { useEffect, useMemo } from "react";
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
  roomId: string;
  websocketUrl: string;
  userName: string;
  entity: { content: any } & Record<string, any>;
  saveHandler: (content: any) => void;
  mentionItems?: Array<User>;
}

export default function RealTimeEditor({
  roomId,
  websocketUrl,
  userName,
  entity,
  saveHandler,
  mentionItems = [],
}: RealTimeEditorProps) {
  const doc = useMemo(() => new Y.Doc(), []);
  const provider:
    | WebsocketProvider
    | (WebsocketProvider & { isReady: boolean }) = useMemo(
    () => new WebsocketProvider(websocketUrl, roomId, doc),
    [doc, websocketUrl, roomId],
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
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: userName,
        color: getRandomColor(),
      },
      showCursorLabels: "activity",
    },
  });

  useEffect(() => {
    function setDefault() {
      if (!editor) {
        return;
      }

      if (editor.document.length === 1) {
        editor.insertBlocks(entity?.content, editor.document[0]);
      }
    }

    if ("isReady" in provider && provider.isReady) {
      setDefault();
    }

    provider.on("sync", setDefault);

    return () => provider.off("sync", setDefault);
  }, [provider, editor, entity?.content]);

  useEffect(() => {
    const id = setInterval(() => {
      saveHandler(editor.document);
    }, 5000);

    return () => clearInterval(id);
  });

  return (
    <BlockNoteView
      className="bg-white w-full mx-4 p-4"
      editor={editor}
      data-color-scheme="light"
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
