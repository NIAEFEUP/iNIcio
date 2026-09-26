import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { isRecruiter } from "@/lib/recruiter";

export async function getSessionUser() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required");
  }

  return session.user;
}

export async function requireAdminSession() {
  const user = await getSessionUser();
  const admin = await isAdmin(user.id);
  if (!admin) {
    throw new Error("Unauthorized: Admin privileges required");
  }
  return user;
}

export async function requireRecruiterSession(recruitmentId?: number) {
  const user = await getSessionUser();
  const recruiter = await isRecruiter(user.id, recruitmentId);
  if (!recruiter) {
    throw new Error("Unauthorized: Recruiter privileges required");
  }
  return user;
}
