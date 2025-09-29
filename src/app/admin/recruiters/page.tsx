import RecruiterAdminClient from "@/components/admin/recruiter-admin-client";
import {
  getUsers,
  addRecruiter,
  deleteRecruiter,
  getRecruiters,
} from "@/lib/recruitment";

export default async function RecruitersAdminPage() {
  const recruiters = await getRecruiters();
  const users = await getUsers();

  async function addRecruiterAction(userId: string) {
    "use server";
    await addRecruiter(userId);
  }

  async function removeRecruiterAction(userId: string) {
    "use server";
    await deleteRecruiter(userId);
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
