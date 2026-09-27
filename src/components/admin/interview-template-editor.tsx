"use client";

import { InterviewTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction } from "react";
import type { SaveStatus } from "../editor/real-time-editor";

interface InterviewTemplateEditorProps {
  user: User;
  token?: string;
  addInterviewTemplateAction: (update: Array<any>) => Promise<void>;
  templateState: InterviewTemplate;
  setTemplateState: Dispatch<SetStateAction<InterviewTemplate>>;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

export default function InterviewTemplateEditor({
  user,
  addInterviewTemplateAction,
  templateState,
  setTemplateState,
  onSaveStatusChange,
}: InterviewTemplateEditorProps) {
  return (
    <RealTimeEditor
      key="interview-template-editor"
      docId="interview-template-editor"
      userName={user?.name || "Anonymous"}
      collab={false}
      onChange={(editor) => {
        setTemplateState((prev) => ({ ...prev, content: editor?.document }));
      }}
      onSaveStatusChange={onSaveStatusChange}
      saveHandler={addInterviewTemplateAction}
      saveHandlerTimeout={1000}
      entity={templateState}
    />
  );
}
