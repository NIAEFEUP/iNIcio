"use client";

import { FinalMessageTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction } from "react";

interface RejectedMessageTemplateEditorProps {
  user: User;
  token: string;
  addRejectedMessageTemplateAction: (update: Array<any>) => Promise<void>;
  templateState: FinalMessageTemplate;
  setTemplateState: Dispatch<SetStateAction<FinalMessageTemplate>>;
}

export default function RejectedMessageTemplateEditor({
  user,
  token,
  addRejectedMessageTemplateAction,
  templateState,
  setTemplateState,
}: RejectedMessageTemplateEditorProps) {
  return (
    <RealTimeEditor
      token={token}
      key={`rejected-message-editor-${templateState.recruitmentId ?? "default"}`}
      docId={`rejected-message-template-editor-${templateState.recruitmentId ?? "default"}`}
      roomId={`rejected-message-template-room-${templateState.recruitmentId ?? "default"}`}
      userName={user?.name || "Anonymous"}
      saveHandler={addRejectedMessageTemplateAction}
      saveHandlerTimeout={1000}
      onChange={(editor) => {
        setTemplateState((prev) => ({ ...prev, content: editor?.document }));
      }}
      entity={templateState}
    />
  );
}
