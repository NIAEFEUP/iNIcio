import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { headers } from "next/headers";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";

export default async function AdminTemplates() {
  const session = await auth.api.getSession({ headers: await headers() });

  const interviewTemplate = await getInterviewTemplate();
  const dynamicTemplate = await getDynamicTemplate();

  const addInterviewTemplateAction = async (update: any) => {
    "use server";

    try {
      await addInterviewTemplate(update);
    } catch (error) {
      console.error("Error saving interview template:", error);
      throw error;
    }
  };

  const addDynamicTemplateAction = async (update: any) => {
    "use server";

    try {
      await addDynamicTemplate(update);
    } catch (error) {
      console.error("Error saving dynamic template:", error);
      throw error;
    }
  };

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <Tabs defaultValue="interview" className="w-full max-w-[40em]">
      <TabsList className="w-full max-w-[40em]">
        <TabsTrigger value="interview">Entrevistas</TabsTrigger>
        <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
      </TabsList>
      <TabsContent value="interview">
        <RealTimeEditor
          token={jwt}
          key="interview-editor"
          docId="interview-template-editor"
          roomId="interview-template-room"
          userName={session?.user.name || "Anonymous"}
          saveHandler={addInterviewTemplateAction}
          saveHandlerTimeout={3000}
          entity={interviewTemplate}
        />
      </TabsContent>
      <TabsContent value="dynamic">
        <RealTimeEditor
          token={jwt}
          key="dynamic-editor"
          docId="dynamic-template-editor"
          roomId="dynamic-template-room"
          userName={session?.user.name || "Anonymous"}
          saveHandler={addDynamicTemplateAction}
          saveHandlerTimeout={3000}
          entity={dynamicTemplate}
        />
      </TabsContent>
    </Tabs>
  );
}
