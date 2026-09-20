export const dynamic = "force-dynamic";

import "./globals.css";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isCandidate } from "@/lib/candidate";
import { isRecruiter } from "@/lib/recruiter";
import { hasApplication } from "@/lib/application";
import { getCurrentRecruitmentState } from "@/lib/recruitment";
import LandingPage from "@/components/home/landing-page";

export default async function Home() {
  const recruitmentState = await getCurrentRecruitmentState();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  const candidate = userId ? await isCandidate(userId) : false;
  const recruiter = userId ? await isRecruiter(userId) : false;
  const admin = session?.user?.role === "admin";
  const userHasApplied = userId
    ? await hasApplication(userId, recruitmentState.recruitment?.id)
    : false;

  const formattedDeadline = recruitmentState.applicationPhase?.end
    ? new Date(recruitmentState.applicationPhase.end).toLocaleString("pt-PT", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <LandingPage
      user={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              role: session.user.role as "candidate" | "recruiter" | "admin",
            }
          : null
      }
      isCandidate={candidate}
      isRecruiter={recruiter}
      isAdmin={admin}
      hasApplied={userHasApplied}
      recruitmentStatus={recruitmentState.status}
      applicationStatus={recruitmentState.applicationStatus}
      applicationDeadline={formattedDeadline}
      phases={recruitmentState.phases}
    />
  );
}
