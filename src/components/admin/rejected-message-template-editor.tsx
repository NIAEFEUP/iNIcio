"use client";

import { FinalMessageTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction, useState } from "react";

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
      key="rejected-message-editor"
      docId="rejected-message-template-editor"
      roomId="rejected-message-template-room"
      userName={user.name || "Anonymous"}
      onChange={(editor) => {
        templateState.content = editor?.document;
        setTemplateState(templateState);
      }}
      saveHandler={addRejectedMessageTemplateAction}
      saveHandlerTimeout={1000}
      entity={templateState}
    />
  );
}
