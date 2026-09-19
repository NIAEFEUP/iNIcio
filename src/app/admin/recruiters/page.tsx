import RecruiterAdminClient from "@/components/admin/recruiter-admin-client";
import {
  getUsers,
  addRecruiter,
  deleteRecruiter,
  getRecruiters,
} from "@/lib/recruitment";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { requireAdminSession } from "@/lib/action-guard";

export default async function RecruitersAdminPage() {
  const targetId = await getTargetRecruitmentId();
  const recruiters = await getRecruiters(targetId);
  const users = await getUsers();

  async function addRecruiterAction(userId: string) {
    "use server";
    await requireAdminSession();
    const resolvedTargetId = await getTargetRecruitmentId();
    await addRecruiter(userId, resolvedTargetId);
  }

  async function removeRecruiterAction(userId: string) {
    "use server";
    await requireAdminSession();
    const resolvedTargetId = await getTargetRecruitmentId();
    await deleteRecruiter(userId, resolvedTargetId);
  }

  return (
    <RecruiterAdminClient
      recruiters={recruiters}
      users={users}
      addRecruiter={addRecruiterAction}
      removeRecruiter={removeRecruiterAction}
    />
  );
}
