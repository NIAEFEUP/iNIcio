import RecruitmentAdminClient from "@/components/admin/recruitment-admin-client";
import { Recruitment } from "@/lib/db";
import {
  addRecruitment,
  deleteRecruitment,
  duplicatePhasesFromPreviousRecruitment,
  editRecruitment,
  getRecruitments,
} from "@/lib/recruitment";

export default async function RecruitmentAdmin() {
  const recruitments = await getRecruitments();

  const add = async (recruitment: Recruitment) => {
    "use server";

    return addRecruitment(recruitment);
  };

  const edit = async (recruitment: Recruitment) => {
    "use server";

    await editRecruitment(recruitment);
  };

  const deleteRecruitmentAction = async (id: number) => {
    "use server";

    await deleteRecruitment(id);
  };

  const duplicatePhasesAction = async (id: number) => {
    "use server";

    return duplicatePhasesFromPreviousRecruitment(id);
  };

  return (
    <RecruitmentAdminClient
      recruitments={recruitments}
      addRecruitment={add}
      editRecruitment={edit}
      deleteRecruitment={deleteRecruitmentAction}
      duplicatePhases={duplicatePhasesAction}
    />
  );
}
