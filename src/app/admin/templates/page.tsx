import RealTimeEditor from "@/components/editor/real-time-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { headers } from "next/headers";

export default async function AdminTemplates() {
  const session = await auth.api.getSession({ headers: await headers() });

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

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <Tabs defaultValue="interview" className="w-full max-w[40em]">
      <TabsList className="w-full max-w[40em]">
        <TabsTrigger value="interview">Entrevistas</TabsTrigger>
        <TabsTrigger value="dynamic">Dinâmicas</TabsTrigger>
      </TabsList>
      <TabsContent value="interview">
        <RealTimeEditor
          token={jwt}
          key="interview-editor"
          docId="interview-template-editor"
          saveHandler={addInterviewTemplateAction}
          entity={interviewTemplate}
        />
      </TabsContent>
      <TabsContent value="dynamic">
        <RealTimeEditor
          token={jwt}
          key="dynamic-editor"
          docId="dynamic-template-editor"
          saveHandler={addDynamicTemplateAction}
          entity={dynamicTemplate}
        />
      </TabsContent>
    </Tabs>
  );
}
