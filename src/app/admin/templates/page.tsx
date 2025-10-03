import RealTimeEditor from "@/components/editor/real-time-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";

export default async function AdminTemplates() {
  const addInterviewTemplateAction = async (content: any) => {
    "use server";

    await addInterviewTemplate(content);
  };

  const addDynamicTemplateAction = async (content: any) => {
    "use server";

    await addDynamicTemplate(content);
  };

  const interviewTemplate = await getInterviewTemplate();
  const dynamicTemplate = await getDynamicTemplate();

  return (
    <Tabs defaultValue="interview" className="w-full max-w[40em]">
      <TabsList className="w-full max-w[40em]">
        <TabsTrigger value="interview">Entrevistas</TabsTrigger>
        <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
      </TabsList>
      <TabsContent value="interview">
        <RealTimeEditor
          key="interview-editor"
          docId="interview-template-editor"
          saveHandler={addInterviewTemplateAction}
          entity={interviewTemplate}
        />
      </TabsContent>
      <TabsContent value="dynamic">
        <RealTimeEditor
          key="dynamic-editor"
          docId="dynamic-template-editor"
          saveHandler={addDynamicTemplateAction}
          entity={dynamicTemplate}
        />
      </TabsContent>
    </Tabs>
  );
}
