import { getApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  if (session?.user) {
    const application = await getApplication(session?.user.id);

    if (application) {
      redirect("/candidate/progress");
    }
  }

  return <>{children}</>;
}
