import RecruitmentAdminClient from "@/components/admin/recruitment-admin-client";
import { Recruitment } from "@/lib/db";
import {
  addRecruitment,
  deleteRecruitment,
  editRecruitment,
  getRecruitments,
} from "@/lib/recruitment";

export default async function RecruitmentAdmin() {
  const recruitments = await getRecruitments();

  const add = async (recruitment: Recruitment) => {
    "use server";

    await addRecruitment(recruitment);
  };

  const edit = async (recruitment: Recruitment) => {
    "use server";

    await editRecruitment(recruitment);
  };

  const deleteRecruitmentAction = async (year: number) => {
    "use server";

    await deleteRecruitment(year);
  };

  return (
    <RecruitmentAdminClient
      recruitments={recruitments}
      addRecruitment={add}
      editRecruitment={edit}
      deleteRecruitment={deleteRecruitmentAction}
    />
  );
}
