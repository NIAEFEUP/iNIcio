"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import type { FinalMessageTemplate } from "@/lib/db";
import AcceptedMessageTemplateEditor from "./accepted-message-template-editor";
import RejectedMessageTemplateEditor from "./rejected-message-template-editor";

interface AdminFinalMessageClientProps {
  recruitmentTitle?: string;
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
  recruitmentTitle,
  acceptedMessageOverrideAction,
  rejectedMessageOverrideAction,
  addAcceptedMessageTemplateAction,
  addRejectedMessageTemplateAction,
  session,
  jwt,
  acceptedMessageTemplate,
  rejectedMessageTemplate,
}: AdminFinalMessageClientProps) {
  const [activeTab, setActiveTab] = useState<"accepted" | "rejected">(
    "accepted",
  );

  const [acceptedMessageTemplateState, setAcceptedMessageTemplate] = useState({
    id: acceptedMessageTemplate.id,
    type: acceptedMessageTemplate.type,
    content: acceptedMessageTemplate.content,
    recruitmentId: acceptedMessageTemplate.recruitmentId,
  });

  const [rejectedMessageTemplateState, setRejectedMessageTemplate] = useState({
    id: rejectedMessageTemplate.id,
    type: rejectedMessageTemplate.type,
    content: rejectedMessageTemplate.content,
    recruitmentId: rejectedMessageTemplate.recruitmentId,
  });

  const [acceptedMessageDialogOpen, setAcceptedMessageDialogOpen] =
    useState(false);
  const [rejectedMessageDialogOpen, setRejectedMessageDialogOpen] =
    useState(false);
  const [isAcceptedOverriding, setIsAcceptedOverriding] = useState(false);
  const [isRejectedOverriding, setIsRejectedOverriding] = useState(false);

  const handleAcceptedOverride = async () => {
    setIsAcceptedOverriding(true);
    try {
      await acceptedMessageOverrideAction(
        acceptedMessageTemplateState.content as Array<any>,
      );
      toast.add({
        type: "success",
        title: "Modelo de mensagem de aceitação aplicado com sucesso!",
      });
      setAcceptedMessageDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Erro ao aplicar modelo de mensagem de aceitação.",
      });
    } finally {
      setIsAcceptedOverriding(false);
    }
  };

  const handleRejectedOverride = async () => {
    setIsRejectedOverriding(true);
    try {
      await rejectedMessageOverrideAction(
        rejectedMessageTemplateState.content as Array<any>,
      );
      toast.add({
        type: "success",
        title: "Modelo de mensagem de rejeição aplicado com sucesso!",
      });
      setRejectedMessageDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Erro ao aplicar modelo de mensagem de rejeição.",
      });
    } finally {
      setIsRejectedOverriding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mensagens Finais"
        viewModeToggle={
          activeTab === "accepted" ? (
            <Dialog
              open={acceptedMessageDialogOpen}
              onOpenChange={setAcceptedMessageDialogOpen}
            >
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    className="h-8 gap-1.5 px-2.5 md:px-3 text-xs shrink-0"
                    title="Forçar Substituição"
                    aria-label="Forçar Substituição"
                  >
                    <RotateCcw className="size-3.5" />
                    <span className="hidden md:inline">
                      Forçar Substituição
                    </span>
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Forçar substituição da mensagem de aceitação?
                  </DialogTitle>
                  <DialogDescription>
                    Esta ação irá guardar e aplicar o conteúdo atual do editor
                    como a mensagem final para candidatos aceites no
                    recrutamento ativo
                    {recruitmentTitle ? ` (${recruitmentTitle})` : ""}.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={isAcceptedOverriding}
                    onClick={() => setAcceptedMessageDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isAcceptedOverriding}
                    onClick={handleAcceptedOverride}
                  >
                    {isAcceptedOverriding ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />A
                        aplicar...
                      </>
                    ) : (
                      "Confirmar Substituição"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog
              open={rejectedMessageDialogOpen}
              onOpenChange={setRejectedMessageDialogOpen}
            >
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    className="h-8 gap-1.5 px-2.5 md:px-3 text-xs shrink-0"
                    title="Forçar Substituição"
                    aria-label="Forçar Substituição"
                  >
                    <RotateCcw className="size-3.5" />
                    <span className="hidden md:inline">
                      Forçar Substituição
                    </span>
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Forçar substituição da mensagem de rejeição?
                  </DialogTitle>
                  <DialogDescription>
                    Esta ação irá guardar e aplicar o conteúdo atual do editor
                    como a mensagem final para candidatos rejeitados no
                    recrutamento ativo
                    {recruitmentTitle ? ` (${recruitmentTitle})` : ""}.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={isRejectedOverriding}
                    onClick={() => setRejectedMessageDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isRejectedOverriding}
                    onClick={handleRejectedOverride}
                  >
                    {isRejectedOverriding ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />A
                        aplicar...
                      </>
                    ) : (
                      "Confirmar Substituição"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "accepted" | "rejected")}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="accepted">Aceite</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitado</TabsTrigger>
        </TabsList>
        <TabsContent value="accepted" className="flex flex-col gap-2 pt-2">
          <AcceptedMessageTemplateEditor
            addAcceptedMessageTemplateAction={addAcceptedMessageTemplateAction}
            user={session?.user}
            token={jwt}
            templateState={acceptedMessageTemplateState}
            setTemplateState={setAcceptedMessageTemplate}
          />
        </TabsContent>
        <TabsContent value="rejected" className="flex flex-col gap-2 pt-2">
          <RejectedMessageTemplateEditor
            addRejectedMessageTemplateAction={addRejectedMessageTemplateAction}
            user={session?.user}
            token={jwt}
            templateState={rejectedMessageTemplateState}
            setTemplateState={setRejectedMessageTemplate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
