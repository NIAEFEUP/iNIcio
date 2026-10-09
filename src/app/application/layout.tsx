import { hasAnyApplication } from "@/lib/application";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getCurrentRecruitmentState } from "@/lib/recruitment";
import { redirect } from "next/navigation";

export default async function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) redirect("/login");

  if (await isRecruiter(session.user.id)) redirect("/candidates");

  const userHasAnyApp = await hasAnyApplication(session.user.id);
  const currentRecruitment = await getCurrentRecruitmentState();

  if (!userHasAnyApp && !currentRecruitment.canApply) {
    redirect("/");
  }

  return <>{children}</>;
}
