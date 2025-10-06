"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DynamicTemplate, InterviewTemplate } from "@/lib/db";
import InterviewTemplateEditor from "./interview-template-editor";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { useState } from "react";
import DynamicTemplateEditor from "./dynamic-template-editor";

interface AdminTemplateClientProps {
  addInterviewTemplateAction: (update: Array<any>) => Promise<void>;
  addDynamicTemplateAction: (update: Array<any>) => Promise<void>;
  session: any;
  jwt: string;
  interviewTemplate: InterviewTemplate;
  dynamicTemplate: DynamicTemplate;
}

export default function AdminTemplateClient({
  addInterviewTemplateAction,
  addDynamicTemplateAction,
  session,
  jwt,
  interviewTemplate,
  dynamicTemplate,
}: AdminTemplateClientProps) {
  const [interviewTemplateState, setInterviewTemplate] = useState({
    id: interviewTemplate.id,
    content: interviewTemplate.content,
  });

  const [dynammicTemplateState, setDynamicTemplate] = useState({
    id: dynamicTemplate.id,
    content: dynamicTemplate.content,
  });

  return (
    <Tabs defaultValue="interview" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="interview">Entrevistas</TabsTrigger>
        <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
      </TabsList>
      <TabsContent value="interview">
        <InterviewTemplateEditor
          addInterviewTemplateAction={addInterviewTemplateAction}
          user={session?.user}
          token={jwt}
          templateState={interviewTemplateState}
          setTemplateState={setInterviewTemplate}
        />
      </TabsContent>
      <TabsContent value="dynamic">
        <DynamicTemplateEditor
          addInterviewTemplateAction={addDynamicTemplateAction}
          user={session?.user}
          token={jwt}
          templateState={dynammicTemplateState}
          setTemplateState={setDynamicTemplate}
        />
      </TabsContent>
    </Tabs>
  );
}
