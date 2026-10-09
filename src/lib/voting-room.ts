import "server-only";

import { isAdmin } from "./admin";
import { generateJWT } from "./jwt";
import { isRecruiter } from "./recruiter";
import { getVotingPhaseRecruitmentId } from "./voting";

/**
 * Token for the live voting room. The role is derived from the same checks
 * the voting pages use: admins are "admin", recruiters of the phase's
 * recruitment are "recruiter", everyone else gets no token and no socket.
 */
export async function getVotingRoomToken(
  userId: string | null | undefined,
  votingPhaseId: number,
): Promise<string> {
  if (!userId) return "";

  if (await isAdmin(userId)) {
    return generateJWT(userId, "admin", [`voting/${votingPhaseId}`]);
  }

  const recruitmentId = await getVotingPhaseRecruitmentId(votingPhaseId);
  if (recruitmentId && (await isRecruiter(userId, recruitmentId))) {
    return generateJWT(userId, "recruiter", [`voting/${votingPhaseId}`]);
  }

  return "";
}
