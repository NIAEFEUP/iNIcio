export const dynamic = "force-dynamic";

import "./globals.css";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isCandidate } from "@/lib/candidate";
import { isRecruiter } from "@/lib/recruiter";
import { getCurrentRecruitmentState } from "@/lib/recruitment";
import { redirect } from "next/navigation";

import RecruitmentActiveMessage from "@/components/home/recruitment-active-message";
import RecruiterActiveMessage from "@/components/home/recruiter-active-message";
import ApplicationsClosedMessage from "@/components/home/applications-closed-message";
import NotRecruitingMessage from "@/components/home/not-recruiting-message";

export default async function Home() {
  const recruitmentState = await getCurrentRecruitmentState();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (await isCandidate(session?.user.id)) {
    redirect("/candidate/progress");
  }

  const recruiter = await isRecruiter(session?.user.id);

  if (recruitmentState.status === "open") {
    if (recruiter) {
      return <RecruiterActiveMessage />;
    }

    if (!recruitmentState.canApply) {
      return <ApplicationsClosedMessage phases={recruitmentState.phases} />;
    }

    return (
      <RecruitmentActiveMessage
        user={
          session?.user
            ? {
                ...session?.user,
                image: session?.user.image ?? "/default-avatar.png",
                role: session?.user.role as "recruiter" | "candidate" | "admin",
              }
            : null
        }
        applicationDeadline={
          recruitmentState.applicationPhase?.end
            ? new Date(recruitmentState.applicationPhase.end).toLocaleString(
                "pt-PT",
              )
            : null
        }
      />
    );
  }

  return (
    <NotRecruitingMessage
      nextStart={
        recruitmentState.status === "upcoming"
          ? (recruitmentState.recruitment?.start ?? null)
          : null
      }
    />
  );
}
