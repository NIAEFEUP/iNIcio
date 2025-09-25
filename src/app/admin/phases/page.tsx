import PhaseAdminClient from "@/components/admin/phase-admin-client";
import { RecruitmentPhase } from "@/lib/db";
import {
  getRecruitmentPhases,
  addRecruitmentPhase,
  editRecruitmentPhase,
  deleteRecruitmentPhase,
} from "@/lib/recruitment";

export default async function RecruitmentAdmin() {
  const recruitmentPhases = await getRecruitmentPhases();

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
    />
  );
}
