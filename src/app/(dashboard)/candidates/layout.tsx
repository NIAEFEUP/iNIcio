import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { redirect } from "next/navigation";

export default async function CandidatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/");
  }

  const targetRecruitmentId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session.user.id, targetRecruitmentId))) {
    return redirect("/");
  }

  return children;
}
