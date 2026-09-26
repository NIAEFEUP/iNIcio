export const dynamic = "force-dynamic";

import "./globals.css";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isCandidate } from "@/lib/candidate";
import { isRecruiter } from "@/lib/recruiter";
import {
  getUserApplications,
  getApplicationInterests,
  type UserApplicationWithDetails,
} from "@/lib/application";
import { getFilenameUrl } from "@/lib/file-upload";
import { getAllCandidateResults } from "@/lib/final-messages";
import { getCurrentRecruitmentState } from "@/lib/recruitment";
import { getOpenDayAnnouncement } from "@/lib/open-day";
import LandingPage from "@/components/home/landing-page";

export default async function Home() {
  const recruitmentState = await getCurrentRecruitmentState();
  const openDayAnnouncement = await getOpenDayAnnouncement(
    recruitmentState.recruitment?.id,
  );

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;
  const candidate = userId ? await isCandidate(userId) : false;
  const recruiter = userId ? await isRecruiter(userId) : false;
  const admin = session?.user?.role === "admin";

  const userApplications = userId ? await getUserApplications(userId) : [];
  const candidateResults = userId ? await getAllCandidateResults(userId) : [];

  const resultsByRecruitmentId = new Map(
    candidateResults.map((r) => [r.recruitmentId, r]),
  );

  const applicationsWithDetails: UserApplicationWithDetails[] =
    await Promise.all(
      userApplications.map(async (app) => {
        const [interests, curriculumUrl] = await Promise.all([
          getApplicationInterests(app),
          getFilenameUrl(app.curriculum),
        ]);

        const result = resultsByRecruitmentId.get(app.recruitmentId) ?? null;

        return {
          ...app,
          curriculum: curriculumUrl,
          interests,
          result,
        };
      }),
    );

  const userHasAppliedCurrent = recruitmentState.recruitment?.id
    ? userApplications.some(
        (app) => app.recruitmentId === recruitmentState.recruitment!.id,
      )
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
      hasApplied={userHasAppliedCurrent}
      userApplications={applicationsWithDetails}
      currentRecruitmentId={recruitmentState.recruitment?.id ?? null}
      recruitmentStatus={recruitmentState.status}
      applicationStatus={recruitmentState.applicationStatus}
      applicationDeadline={formattedDeadline}
      phases={recruitmentState.phases}
      openDayAnnouncement={openDayAnnouncement}
    />
  );
}
