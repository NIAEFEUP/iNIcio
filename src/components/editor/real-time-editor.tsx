"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getRandomColor } from "@/lib/color";
import { Interview } from "@/lib/db";
import { BlockNoteEditor } from "@blocknote/core";

interface RealTimeEditorProps {
  roomId: string;
  websocketUrl: string;
  userName: string;
  interview: Interview;
  saveHandler: (content: any) => void;
}

export default function RealTimeEditor({
  roomId,
  websocketUrl,
  userName,
  interview,
  saveHandler,
}: RealTimeEditorProps) {
  const doc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new WebsocketProvider(websocketUrl, roomId, doc),
    [doc, websocketUrl, roomId],
  );

  const editor = useCreateBlockNote({
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
        editor.insertBlocks(interview.content, editor.document[0]);
      }
    }

    if (provider.isReady) {
      setDefault();
    }

    provider.on("sync", setDefault);

    return () => provider.off("sync", setDefault);
  }, [provider, editor, interview?.content]);

  useEffect(() => {
    const id = setInterval(() => {
      saveHandler(editor.document);
    }, 5000);

    return () => clearInterval(id);
  });

  return <BlockNoteView className="w-full mx-4 p-4 h-128" editor={editor} />;
}
