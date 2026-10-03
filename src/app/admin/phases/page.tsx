import { cookies } from "next/headers";
import PhaseAdminClient from "@/components/admin/phase-admin-client";
import { RecruitmentPhase } from "@/lib/db";
import {
  addRecruitmentPhase,
  editRecruitmentPhase,
  deleteRecruitmentPhase,
  getAllRecruitmentPhases,
} from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { requireAdminSession } from "@/lib/action-guard";
import { PHASES_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";

export default async function RecruitmentAdmin({ searchParams }: any) {
  const cookieStore = await cookies();
  const initialViewMode =
    cookieStore.get(PHASES_VIEW_MODE_COOKIE_NAME)?.value === "grid"
      ? "grid"
      : "list";

  const params = await searchParams;
  const targetRecruitment = await getTargetRecruitment();

  let recruitmentId = targetRecruitment?.id;
  if (params.recruitmentId !== undefined && params.recruitmentId !== null) {
    const parsed = Number.parseInt(String(params.recruitmentId), 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      recruitmentId = parsed;
    }
  }

  const recruitmentPhases = await getAllRecruitmentPhases(recruitmentId);

  const add = async (phase: RecruitmentPhase) => {
    "use server";
    await requireAdminSession();

    if (!phase.recruitmentId) {
      throw new Error("No recruitment selected");
    }

    await addRecruitmentPhase(phase);
  };

  const edit = async (phase: RecruitmentPhase) => {
    "use server";
    await requireAdminSession();

    await editRecruitmentPhase(phase);
  };

  const remove = async (id: number) => {
    "use server";
    await requireAdminSession();

    await deleteRecruitmentPhase(id);
  };

  return (
    <PhaseAdminClient
      initialViewMode={initialViewMode}
      phases={recruitmentPhases}
      addPhase={add}
      editPhase={edit}
      deletePhase={remove}
      defaultRecruitmentId={recruitmentId}
    />
  );
}
