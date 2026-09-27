"use client";

import { DynamicTemplate, User } from "@/lib/db";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { Dispatch, SetStateAction } from "react";
import type { SaveStatus } from "../editor/real-time-editor";

interface DynamicTemplateEditorProps {
  user: User;
  token?: string;
  addDynamicTemplateAction: (update: Array<any>) => Promise<void>;
  templateState: DynamicTemplate;
  setTemplateState: Dispatch<SetStateAction<DynamicTemplate>>;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

export default function DynamicTemplateEditor({
  user,
  addDynamicTemplateAction,
  templateState,
  setTemplateState,
  onSaveStatusChange,
}: DynamicTemplateEditorProps) {
  return (
    <RealTimeEditor
      key="dynamic-template-editor"
      docId="dynamic-template-editor"
      userName={user?.name || "Anonymous"}
      collab={false}
      onChange={(editor) => {
        setTemplateState((prev) => ({ ...prev, content: editor?.document }));
      }}
      onSaveStatusChange={onSaveStatusChange}
      saveHandler={addDynamicTemplateAction}
      saveHandlerTimeout={1000}
      entity={templateState}
    />
  );
}
