"use client";

import { FinalMessageTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction, useState } from "react";

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
      key="accepted-message-editor"
      docId="accepted-message-template-editor"
      roomId="accepted-message-template-room"
      userName={user.name || "Anonymous"}
      onChange={(editor) => {
        templateState.content = editor?.document;
        setTemplateState(templateState);
      }}
      saveHandler={addAcceptedMessageTemplateAction}
      saveHandlerTimeout={1000}
      entity={templateState}
    />
  );
}
