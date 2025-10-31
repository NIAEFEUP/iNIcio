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

import { FinalMessageTemplate } from "@/lib/db";
import InterviewTemplateEditor from "./interview-template-editor";
import { RealTimeEditor } from "../editor/real-time-editor-dynamic-import";
import { useState } from "react";
import DynamicTemplateEditor from "./dynamic-template-editor";
import { DialogTitle } from "@radix-ui/react-dialog";
import AcceptedMessageTemplateEditor from "./accepted-message-template-editor";
import RejectedMessageTemplateEditor from "./rejected-message-template-editor";

interface AdminTemplateClientProps {
  acceptedMessageOverrideAction: (update: Array<any>) => Promise<void>;
  rejectedMessageOverrideAction: (update: Array<any>) => Promise<void>;
  addAcceptedMessageTemplateAction: (update: Array<any>) => Promise<void>;
  addRejectedMessageTemplateAction: (update: Array<any>) => Promise<void>;
  session: any;
  jwt: string;
  acceptedMessageTemplate: FinalMessageTemplate;
  rejectedMessageTemplate: FinalMessageTemplate;
}

export default function AdminFinalMessageClient({
  acceptedMessageOverrideAction,
  rejectedMessageOverrideAction,
  addAcceptedMessageTemplateAction,
  addRejectedMessageTemplateAction,
  session,
  jwt,
  acceptedMessageTemplate,
  rejectedMessageTemplate,
}: AdminTemplateClientProps) {
  const [acceptedMessageTemplateState, setAcceptedMessageTemplate] = useState({
    id: acceptedMessageTemplate.id,
    type: acceptedMessageTemplate.type,
    content: acceptedMessageTemplate.content,
  });

  const [rejectedMessageTemplateState, setRejectedMessageTemplate] = useState({
    id: rejectedMessageTemplate.id,
    type: rejectedMessageTemplate.type,
    content: rejectedMessageTemplate.content,
  });

  const [acceptedMessageDialogOpen, setAcceptedMessageDialogOpen] =
    useState(false);
  const [rejectedMessageDialogOpen, setRejectedMessageDialogOpen] =
    useState(false);

  return (
    <Tabs defaultValue="accepted" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="accepted">Aceite</TabsTrigger>
        <TabsTrigger value="rejected">Rejeitado</TabsTrigger>
      </TabsList>
      <TabsContent value="accepted" className="flex flex-col gap-2">
        <Dialog
          open={acceptedMessageDialogOpen}
          onOpenChange={setAcceptedMessageDialogOpen}
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
                  acceptedMessageOverrideAction(
                    acceptedMessageTemplateState.content as Array<any>,
                  );
                  setAcceptedMessageDialogOpen(false);
                }}
              >
                Confirmar
              </Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <AcceptedMessageTemplateEditor
          addAcceptedMessageTemplateAction={addAcceptedMessageTemplateAction}
          user={session?.user}
          token={jwt}
          templateState={acceptedMessageTemplateState}
          setTemplateState={setAcceptedMessageTemplate}
        />
      </TabsContent>
      <TabsContent value="rejected" className="flex flex-col gap-2">
        <Dialog
          open={rejectedMessageDialogOpen}
          onOpenChange={setRejectedMessageDialogOpen}
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
                  rejectedMessageOverrideAction(
                    rejectedMessageTemplateState.content as Array<any>,
                  );
                  setRejectedMessageDialogOpen(false);
                }}
              >
                Confirmar
              </Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <RejectedMessageTemplateEditor
          addRejectedMessageTemplateAction={addRejectedMessageTemplateAction}
          user={session?.user}
          token={jwt}
          templateState={rejectedMessageTemplateState}
          setTemplateState={setRejectedMessageTemplate}
        />
      </TabsContent>
    </Tabs>
  );
}
