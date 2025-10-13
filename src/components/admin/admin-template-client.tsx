"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { DynamicTemplate, InterviewTemplate } from "@/lib/db";
import InterviewTemplateEditor from "./interview-template-editor";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { useState } from "react";
import DynamicTemplateEditor from "./dynamic-template-editor";
import { DialogTitle } from "@radix-ui/react-dialog";
import { interview } from "@/db/schema";

interface AdminTemplateClientProps {
  interviewOverrideAction: (update: Array<any>) => Promise<void>;
  dynamicOverrideAction: (update: Array<any>) => Promise<void>;
  addInterviewTemplateAction: (update: Array<any>) => Promise<void>;
  addDynamicTemplateAction: (update: Array<any>) => Promise<void>;
  session: any;
  jwt: string;
  interviewTemplate: InterviewTemplate;
  dynamicTemplate: DynamicTemplate;
}

export default function AdminTemplateClient({
  interviewOverrideAction,
  dynamicOverrideAction,
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

  const [dynamicDialogOpen, setDynamicDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);

  return (
    <Tabs defaultValue="interview" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="interview">Entrevistas</TabsTrigger>
        <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
      </TabsList>
      <TabsContent value="interview" className="flex flex-col gap-2">
        <Dialog
          open={interviewDialogOpen}
          onOpenChange={setInterviewDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="secondary">Push</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tens a certeza que queres dar override?</DialogTitle>
              <Button
                variant="secondary"
                onClick={() => {
                  interviewOverrideAction(
                    interviewTemplateState.content as Array<any>,
                  );
                  setInterviewDialogOpen(false);
                }}
              >
                Confirmar
              </Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <InterviewTemplateEditor
          addInterviewTemplateAction={addInterviewTemplateAction}
          user={session?.user}
          token={jwt}
          templateState={interviewTemplateState}
          setTemplateState={setInterviewTemplate}
        />
      </TabsContent>
      <TabsContent value="dynamic" className="flex flex-col gap-2">
        <Dialog open={dynamicDialogOpen} onOpenChange={setDynamicDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">Push</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tens a certeza que queres dar override?</DialogTitle>
              <Button
                variant="secondary"
                onClick={() => {
                  dynamicOverrideAction(
                    dynammicTemplateState.content as Array<any>,
                  );
                  setDynamicDialogOpen(false);
                }}
              >
                Confirmar
              </Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>

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
