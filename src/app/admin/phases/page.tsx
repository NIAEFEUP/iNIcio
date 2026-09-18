import PhaseAdminClient from "@/components/admin/phase-admin-client";
import { RecruitmentPhase } from "@/lib/db";
import {
  addRecruitmentPhase,
  editRecruitmentPhase,
  deleteRecruitmentPhase,
  getAllRecruitmentPhases,
} from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

export default async function RecruitmentAdmin({ searchParams }: any) {
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

    if (!phase.recruitmentId) {
      throw new Error("No recruitment selected");
    }

    await addRecruitmentPhase(phase);
  };

  const edit = async (phase: RecruitmentPhase) => {
    "use server";

    await editRecruitmentPhase(phase);
  };

  const remove = async (id: number) => {
    "use server";

    await deleteRecruitmentPhase(id);
  };

  return (
    <PhaseAdminClient
      phases={recruitmentPhases}
      addPhase={add}
      editPhase={edit}
      deletePhase={remove}
      defaultRecruitmentId={recruitmentId}
    />
  );
}
