"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { RotateCcw, Loader2 } from "lucide-react";

import { DynamicTemplate, InterviewTemplate } from "@/lib/db";
import InterviewTemplateEditor from "./interview-template-editor";
import DynamicTemplateEditor from "./dynamic-template-editor";

interface AdminTemplateClientProps {
  interviewOverrideAction: (update: Array<any>) => Promise<void>;
  dynamicOverrideAction: (update: Array<any>) => Promise<void>;
  addInterviewTemplateAction: (update: Array<any>) => Promise<void>;
  addDynamicTemplateAction: (update: Array<any>) => Promise<void>;
  session: any;
  interviewTemplate: InterviewTemplate;
  dynamicTemplate: DynamicTemplate;
}

export default function AdminTemplateClient({
  interviewOverrideAction,
  dynamicOverrideAction,
  addInterviewTemplateAction,
  addDynamicTemplateAction,
  session,
  interviewTemplate,
  dynamicTemplate,
}: AdminTemplateClientProps) {
  const [activeTab, setActiveTab] = useState<"interview" | "dynamic">(
    "interview",
  );

  const [interviewTemplateState, setInterviewTemplate] = useState({
    id: interviewTemplate.id,
    content: interviewTemplate.content,
  });

  const [dynamicTemplateState, setDynamicTemplate] = useState({
    id: dynamicTemplate.id,
    content: dynamicTemplate.content,
  });

  const [dynamicDialogOpen, setDynamicDialogOpen] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [isInterviewOverriding, setIsInterviewOverriding] = useState(false);
  const [isDynamicOverriding, setIsDynamicOverriding] = useState(false);

  const handleInterviewOverride = async () => {
    setIsInterviewOverriding(true);
    try {
      await interviewOverrideAction(
        interviewTemplateState.content as Array<any>,
      );
      toast.add({
        type: "success",
        title: "Modelo de entrevista aplicado com sucesso!",
      });
      setInterviewDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Erro ao aplicar modelo de entrevista.",
      });
    } finally {
      setIsInterviewOverriding(false);
    }
  };

  const handleDynamicOverride = async () => {
    setIsDynamicOverriding(true);
    try {
      await dynamicOverrideAction(dynamicTemplateState.content as Array<any>);
      toast.add({
        type: "success",
        title: "Modelo de dinâmica aplicado com sucesso!",
      });
      setDynamicDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.add({
        type: "error",
        title: "Erro ao aplicar modelo de dinâmica.",
      });
    } finally {
      setIsDynamicOverriding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Modelos"
        viewModeToggle={
          activeTab === "interview" ? (
            <Dialog
              open={interviewDialogOpen}
              onOpenChange={setInterviewDialogOpen}
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
                  <DialogTitle>Forçar substituição de entrevistas?</DialogTitle>
                  <DialogDescription>
                    Esta ação irá substituir o conteúdo do editor de todas as
                    entrevistas desbloqueadas no recrutamento selecionado pelo
                    modelo atual.
                    <br />
                    <br />
                    Entrevistas bloqueadas serão preservadas.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={isInterviewOverriding}
                    onClick={() => setInterviewDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isInterviewOverriding}
                    onClick={handleInterviewOverride}
                  >
                    {isInterviewOverriding ? (
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
              open={dynamicDialogOpen}
              onOpenChange={setDynamicDialogOpen}
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
                  <DialogTitle>Forçar substituição de dinâmicas?</DialogTitle>
                  <DialogDescription>
                    Esta ação irá substituir o conteúdo do editor de todas as
                    dinâmicas desbloqueadas no recrutamento selecionado pelo
                    modelo atual.
                    <br />
                    <br />
                    Dinâmicas bloqueadas serão preservadas.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    disabled={isDynamicOverriding}
                    onClick={() => setDynamicDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isDynamicOverriding}
                    onClick={handleDynamicOverride}
                  >
                    {isDynamicOverriding ? (
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
        onValueChange={(val) => setActiveTab(val as "interview" | "dynamic")}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="interview">Entrevistas</TabsTrigger>
          <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
        </TabsList>
        <TabsContent value="interview" className="flex flex-col gap-2 pt-2">
          <InterviewTemplateEditor
            addInterviewTemplateAction={addInterviewTemplateAction}
            user={session?.user}
            templateState={interviewTemplateState}
            setTemplateState={setInterviewTemplate}
          />
        </TabsContent>
        <TabsContent value="dynamic" className="flex flex-col gap-2 pt-2">
          <DynamicTemplateEditor
            addDynamicTemplateAction={addDynamicTemplateAction}
            user={session?.user}
            templateState={dynamicTemplateState}
            setTemplateState={setDynamicTemplate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
