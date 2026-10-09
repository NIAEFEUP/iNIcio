"use client";

import { FinalMessageTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction } from "react";

interface AcceptedMessageTemplateEditorProps {
  user: User;
  token: string;
  addAcceptedMessageTemplateAction: (update: Array<any>) => Promise<void>;
  templateState: FinalMessageTemplate;
  setTemplateState: Dispatch<SetStateAction<FinalMessageTemplate>>;
}

export default function AcceptedMessageTemplateEditor({
  user,
  token,
  addAcceptedMessageTemplateAction,
  templateState,
  setTemplateState,
}: AcceptedMessageTemplateEditorProps) {
  return (
    <RealTimeEditor
      token={token}
      key={`accepted-message-editor-${templateState.recruitmentId ?? "default"}`}
      docId={`accepted-message-template-editor-${templateState.recruitmentId ?? "default"}`}
      roomId={`accepted-message-template-room-${templateState.recruitmentId ?? "default"}`}
      userName={user?.name || "Anonymous"}
      saveHandler={addAcceptedMessageTemplateAction}
      saveHandlerTimeout={1000}
      onChange={(editor) => {
        setTemplateState((prev) => ({ ...prev, content: editor?.document }));
      }}
      entity={templateState}
    />
  );
}
