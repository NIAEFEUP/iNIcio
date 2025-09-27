import EditProfile from "@/components/profile/edit-profile";
import Profile from "@/components/profile/profile";
import { ResetPassword } from "@/components/profile/reset-password";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getApplication, getApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getFilenameUrl } from "@/lib/file-upload";

import { headers } from "next/headers";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const application = await getApplication(session ? session.user.id : "");
  const applicationInterests = await getApplicationInterests(application);

  const pictureUrl = await getFilenameUrl(session?.user?.image || "");

  return (
    <div className="flex flex-col mx-64 gap-2 items-center justify-center">
      <h1 className="text-xl font-bold text-center">Perfil</h1>
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="edit">Editar</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Profile
            pictureUrl={pictureUrl}
            application={application}
            applicationInterests={applicationInterests}
          />
        </TabsContent>
        <TabsContent value="edit">
          <EditProfile pictureUrl={pictureUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
