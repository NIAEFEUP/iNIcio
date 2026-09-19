import { headers } from "next/headers";
import { redirect } from "next/navigation";

import EditProfile from "@/components/profile/edit-profile";
import Profile from "@/components/profile/profile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { getFilenameUrl } from "@/lib/file-upload";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const pictureUrl = await getFilenameUrl(session.user.image || "");

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          O teu Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere os teus dados de conta e fotografia de perfil
        </p>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="edit">Editar Perfil</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="pt-4">
          <Profile pictureUrl={pictureUrl} />
        </TabsContent>
        <TabsContent value="edit" className="pt-4">
          <EditProfile pictureUrl={pictureUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
