import PhaseAdminClient from "@/components/admin/phase-admin-client";
import { RecruitmentPhase } from "@/lib/db";
import {
  addRecruitmentPhase,
  editRecruitmentPhase,
  deleteRecruitmentPhase,
  getAllRecruitmentPhases,
  getActiveRecruitment,
} from "@/lib/recruitment";

export default async function RecruitmentAdmin() {
  const activeRecruitment = await getActiveRecruitment();
  const recruitmentPhases = await getAllRecruitmentPhases(
    activeRecruitment?.id,
  );

  const add = async (phase: RecruitmentPhase) => {
    "use server";

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
      defaultRecruitmentId={activeRecruitment?.id}
    />
  );
}
