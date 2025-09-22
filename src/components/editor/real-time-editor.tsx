import React from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getRandomColor } from "@/lib/color";

interface RealTimeEditorProps {
  roomId: string;
  websocketUrl: string;
  userName: string;
}

export default function RealTimeEditor({
  roomId,
  websocketUrl,
  userName,
}: RealTimeEditorProps) {
  const doc = new Y.Doc();
  const provider = new WebsocketProvider(websocketUrl, roomId, doc);

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

  return <BlockNoteView className="w-full mx-4 p-4 h-128" editor={editor} />;
}
