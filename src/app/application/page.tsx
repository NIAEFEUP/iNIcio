import { redirect } from "next/navigation";

import ApplicationClient from "@/components/application/application-client";
import { hasApplication } from "@/lib/application";
import { getActiveRecruitment } from "@/lib/recruitment";
import { getSession } from "@/lib/auth";

type ApplicationPageProps = {
  searchParams?: Promise<{ action?: string }>;
};

export default async function Application({
  searchParams,
}: ApplicationPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const isNew = resolvedSearchParams?.action === "new";

  const activeRecruitment = await getActiveRecruitment();

  if (activeRecruitment) {
    const userHasApplied = await hasApplication(
      session.user.id,
      activeRecruitment.id,
    );
    if (userHasApplied && !isNew) {
      redirect("/#candidaturas");
    }
  }

  return <ApplicationClient />;
}
