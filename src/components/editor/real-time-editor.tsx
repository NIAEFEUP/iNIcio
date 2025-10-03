"use client";

import * as Y from "yjs";

import React, { useEffect, useMemo } from "react";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
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

import { jsonbToYjsUpdate } from "@/lib/text-editor";

interface RealTimeEditorProps {
  token?: string;
  docId?: string;
  roomId?: string;
  userName?: string;
  entity?: { content: any } & Record<string, any>;
  saveHandler?: ((update: Uint8Array) => void) | null;
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
  const provider:
    | WebsocketProvider
    | (WebsocketProvider & { isReady: boolean }) = useMemo(
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
    if (!provider) return;

    const ydoc = provider.doc as Y.Doc;
    const yArray = ydoc.getArray("document-store");

    function mergeDefaultContent() {
      if (!entity?.content?.length) return;

      const incomingUpdate = jsonbToYjsUpdate(entity.content);
      Y.applyUpdate(
        ydoc,
        incomingUpdate instanceof Uint8Array
          ? incomingUpdate
          : new Uint8Array(incomingUpdate),
      );

      if (yArray.length === 0) {
        yArray.delete(0, yArray.length);
      }

      return ydoc.getArray("document-store").toJSON();

      // ydoc.transact(() => {
      //   const currentContent = yArray.toJSON();
      //
      //   if (currentContent.length === 0) {
      //     yArray.push(entity.content);
      //     return;
      //   }
      //
      //   entity.content.forEach((block: any) => {
      //     const exists = currentContent.some((b: any) => JSON.stringify(b) === JSON.stringify(block));
      //     if (!exists) {
      //       yArray.push(block);
      //     }
      //   });
      // });
    }

    if ("isReady" in provider && provider.isReady) {
      mergeDefaultContent();
    }

    provider.on("sync", mergeDefaultContent);
    return () => provider.off("sync", mergeDefaultContent);
  }, [provider, entity?.content]);

  useEffect(() => {
    if (!saveHandler || !provider) return;

    const yArray = (provider.doc as Y.Doc).getArray("document-store");

    const id = setInterval(() => {
      saveHandler(jsonbToYjsUpdate(yArray.toJSON()));
    }, saveHandlerTimeout);

    return () => clearInterval(id);
  }, [saveHandler, provider, saveHandlerTimeout]);

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
