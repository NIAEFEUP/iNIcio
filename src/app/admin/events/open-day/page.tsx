import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import OpenDayAdminClient from "@/components/admin/open-day-admin-client";
import { getActiveRecruitment, getRecruitmentById } from "@/lib/recruitment";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export default async function OpenDayAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!(await isAdmin(session?.user.id))) {
    redirect("/");
  }

  const targetId = await getTargetRecruitmentId();
  const recruitment =
    targetId !== undefined
      ? await getRecruitmentById(targetId)
      : await getActiveRecruitment();

  if (!recruitment) {
    redirect("/admin");
  }

  const saveOpenDay = async (input: {
    openDayEnabled: boolean;
    openDayDate: string | null;
    openDayStartTime: string;
    openDayEndTime: string;
    openDayRoom: string;
    openDayImage: string;
  }) => {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!(await isAdmin(currentSession?.user.id))) {
      throw new Error("Unauthorized");
    }

    const updated = {
      ...recruitment,
      openDayEnabled: input.openDayEnabled,
      openDayDate: input.openDayDate ? new Date(input.openDayDate) : null,
      openDayStartTime: input.openDayStartTime,
      openDayEndTime: input.openDayEndTime,
      openDayRoom: input.openDayRoom,
      openDayImage: input.openDayImage,
    };

    const { editRecruitment } = await import("@/lib/recruitment");
    await editRecruitment(updated);
  };

  return <OpenDayAdminClient recruitment={recruitment} onSave={saveOpenDay} />;
}
