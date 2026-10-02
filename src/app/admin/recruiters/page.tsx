import RecruiterAdminClient from "@/components/admin/recruiter-admin-client";
import {
  getUsers,
  addRecruiter,
  deleteRecruiter,
  getRecruiters,
} from "@/lib/recruitment";
import { getRecruiterStats, type RecruiterStats } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { requireAdminSession } from "@/lib/action-guard";

const EMPTY_STATS: RecruiterStats = {
  availabilityMinutes: 0,
  availabilitySlots: 0,
  interviews: 0,
  dynamics: 0,
};

export default async function RecruitersAdminPage() {
  const targetId = await getTargetRecruitmentId();
  const [recruiters, users, stats] = await Promise.all([
    getRecruiters(targetId),
    getUsers(),
    getRecruiterStats(targetId),
  ]);

  const recruitersWithStats = recruiters.map((recruiter) => ({
    ...recruiter,
    ...(stats.get(recruiter.userId) ?? EMPTY_STATS),
  }));

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
      recruiters={recruitersWithStats}
      users={users}
      addRecruiter={addRecruiterAction}
      removeRecruiter={removeRecruiterAction}
    />
  );
}
