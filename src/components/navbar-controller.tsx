"use server";

import { headers } from "next/headers";
import Navbar from "./navbar";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { hasApplication } from "@/lib/application";
import { getActiveRecruitment } from "@/lib/recruitment";
import { getAllCandidateResults } from "@/lib/final-messages";
import { getNotifications } from "@/lib/notifications";

export default async function NavbarController() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const admin = await isAdmin(session?.user?.id);
  const recruiter = await isRecruiter(session?.user?.id);

  const activeRecruitment = await getActiveRecruitment();

  const hasActiveApplication =
    session?.user?.id && activeRecruitment
      ? await hasApplication(session.user.id, activeRecruitment.id)
      : false;

  const showProgress = !!activeRecruitment && hasActiveApplication;

  const candidateResults = session?.user?.id
    ? await getAllCandidateResults(session.user.id)
    : [];

  const hasResultsToShow = candidateResults.some(
    (r) => r.decision === "approved" || r.decision === "rejected",
  );

  const notifications = await getNotifications(session?.user?.id);

  return (
    <Navbar
      isAdmin={admin ? true : false}
      isRecruiter={recruiter ? true : false}
      showProgress={showProgress}
      hasResultsToShow={hasResultsToShow}
      notifications={notifications}
    />
  );
}
