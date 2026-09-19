"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { withCollaboration } from "@blocknote/core/yjs";
import { Mention } from "./mentions";
import { getMentionMenuItems } from "@/lib/text-editor";
import { User } from "@/lib/db";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

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
  collab?: boolean;
  boxed?: boolean;
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
  collab = true,
  boxed = true,
}: RealTimeEditorProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const editorTheme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  const doc = useMemo(() => (collab ? new Y.Doc() : null), [collab]);
  const fragment = useMemo(
    () => (doc ? doc.getXmlFragment(`document-store-${docId}`) : null),
    [doc, docId],
  );
  const [currentContent, setCurrentContent] = useState<string>("");
  const hasSeededContent = useRef(false);
  const isReady = useRef(!collab);
  const isSaving = useRef(false);

  const provider = useMemo(
    () =>
      collab
        ? new WebsocketProvider(
            `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?token=${encodeURIComponent(token)}`,
            roomId,
            doc,
          )
        : null,
    [doc, roomId, token, collab],
  );

  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      mention: Mention,
    },
  });

  const editor = useCreateBlockNote(
    collab
      ? withCollaboration({
          schema,
          collaboration: {
            provider: provider!,
            fragment: doc!.getXmlFragment(`document-store-${docId}`),
            user: {
              name: userName,
              color: getRandomColor(),
            },
            showCursorLabels: "activity",
          },
        })
      : { schema },
  );

  useEffect(() => {
    if (!editor) return;

    const seedDocument = () => {
      if (hasSeededContent.current) return;

      // Let the websocket deliver the shared document before seeding it from
      // the database. This prevents a late joiner from overwriting edits.
      if (collab && fragment && fragment.length > 0) {
        hasSeededContent.current = true;
        isReady.current = true;
        return;
      }

      if (entity?.content) {
        editor.replaceBlocks(editor.document, entity.content);
      }
      hasSeededContent.current = true;
      isReady.current = true;
    };

    if (!collab || !provider) {
      seedDocument();
      return;
    }

    if (provider.synced) {
      seedDocument();
      return;
    }

    provider.on("sync", seedDocument);
    return () => provider.off("sync", seedDocument);
  }, [collab, editor, entity?.content, fragment, provider]);

  useEffect(() => {
    if (!saveHandler || !editor) return;

    const timeout = setInterval(() => {
      void (async () => {
        if (!isReady.current || isSaving.current) return;

        const stringEditorDocument = JSON.stringify(editor.document);
        if (currentContent === stringEditorDocument) return;

        isSaving.current = true;
        try {
          await saveHandler(editor.document);
          setCurrentContent(stringEditorDocument);
        } finally {
          isSaving.current = false;
        }
      })();
    }, saveHandlerTimeout);

    return () => {
      clearInterval(timeout);
    };
  }, [editor, saveHandler, saveHandlerTimeout, currentContent]);

  useEffect(() => {
    return () => {
      if (provider) provider.destroy();
    };
  }, [provider]);

  return (
    <BlockNoteView
      theme={editorTheme}
      className={
        boxed
          ? "h-full w-full min-h-32 rounded-xl border border-input bg-background px-2 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 overflow-y-auto break-words whitespace-pre-wrap"
          : "w-full min-h-32 rounded-xl bg-muted/40 px-1 py-1.5 text-base transition-colors outline-none hover:bg-muted/50 focus-within:ring-3 focus-within:ring-ring/50 overflow-y-auto break-words whitespace-pre-wrap"
      }
      editor={editor}
      editable={true}
      onChange={onChange}
    >
      <SuggestionMenuController
        triggerCharacter={"@"}
        getItems={async (query) =>
          filterSuggestionItems(
            getMentionMenuItems(mentionItems, editor),
            query,
          )
        }
      />
    </BlockNoteView>
  );
}
