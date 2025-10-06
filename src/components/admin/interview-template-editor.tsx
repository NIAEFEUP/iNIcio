"use client";

import { InterviewTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction, useState } from "react";

interface InterviewTemplateEditorProps {
  user: User;
  token: string;
  addInterviewTemplateAction: (update: Array<any>) => Promise<void>;
  templateState: InterviewTemplate;
  setTemplateState: Dispatch<SetStateAction<InterviewTemplate>>;
}

export default function InterviewTemplateEditor({
  user,
  token,
  addInterviewTemplateAction,
  templateState,
  setTemplateState,
}: InterviewTemplateEditorProps) {
  return (
    <RealTimeEditor
      token={token}
      key="interview-editor"
      docId="interview-template-editor"
      roomId="interview-template-room"
      userName={user.name || "Anonymous"}
      onChange={(editor) => {
        templateState.content = editor?.document;
        setTemplateState(templateState);
      }}
      saveHandler={addInterviewTemplateAction}
      saveHandlerTimeout={1000}
      entity={templateState}
    />
  );
}
