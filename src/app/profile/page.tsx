import Profile from "@/components/profile/profile";
import { ResetPassword } from "@/components/profile/reset-password";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getApplication, getApplicationInterests } from "@/lib/application";
import { auth } from "@/lib/auth";

import { headers } from "next/headers";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const application = await getApplication(session ? session.user.id : "");
  const applicationInterests = await getApplicationInterests(application);

  return (
    <div className="flex flex-col mx-64 gap-2 items-center justify-center">
      <h1 className="text-xl font-bold text-center">Perfil</h1>
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Profile
            application={application}
            applicationInterests={applicationInterests}
          />
        </TabsContent>
        <TabsContent value="password">
          <ResetPassword />
        </TabsContent>
      </Tabs>
    </div>
  );
}
