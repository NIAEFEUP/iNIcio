import RecruitmentAdminClient from "@/components/admin/recruitment-admin-client";
import { Recruitment } from "@/lib/db";
import {
  addRecruitment,
  deleteRecruitment,
  duplicatePhasesFromPreviousRecruitment,
  editRecruitment,
  getRecruitments,
} from "@/lib/recruitment";
import { requireAdminSession } from "@/lib/action-guard";

export default async function RecruitmentAdmin() {
  const recruitments = await getRecruitments();

  const add = async (recruitment: Recruitment) => {
    "use server";
    await requireAdminSession();
    return addRecruitment(recruitment);
  };

  const edit = async (recruitment: Recruitment) => {
    "use server";
    await requireAdminSession();
    await editRecruitment(recruitment);
  };

  const deleteRecruitmentAction = async (id: number) => {
    "use server";
    await requireAdminSession();
    await deleteRecruitment(id);
  };

  const duplicatePhasesAction = async (id: number) => {
    "use server";
    await requireAdminSession();
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
