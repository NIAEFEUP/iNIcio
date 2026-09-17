import { getApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isRecruiter } from "@/lib/recruiter";
import { getCurrentRecruitmentState } from "@/lib/recruitment";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/login");

  if (await isAdmin(session.user.id)) redirect("/admin");
  if (await isRecruiter(session.user.id)) redirect("/recruiter/progress");

  if (session?.user) {
    const application = await getApplication(session?.user.id);

    if (application) {
      redirect("/candidate/progress");
    }
  }

  if (!(await getCurrentRecruitmentState()).canApply) redirect("/");

  return <>{children}</>;
}
