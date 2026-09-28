import {
  account,
  admin,
  application,
  applicationComment,
  applicationInterests,
  applicationToTag,
  appreciation,
  candidate,
  candidateToDynamic,
  candidateVote,
  dynamicComment,
  interview,
  interviewComment,
  notification,
  recruiter,
  recruiterAvailability,
  recruiterToCandidate,
  recruiterToDynamic,
  recruiterToInterview,
  recruiterVote,
  recruitmentPhaseStatus,
  session,
  user,
  usersToRecruitments,
  verification,
  votingPhaseCandidate,
  votingPhaseStatus,
} from "@/db/schema";
import { db } from "./db";
import { and, eq, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import {
  deleteFile,
  fromFullUrlToPath,
  getFilenameUrl,
  uploadProfileImage,
} from "./file-upload";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  candidateRecruitmentIds: number[];
  recruiterRecruitmentIds: number[];
}

export const isAdmin = cache(async (userId: string) => {
  if (!userId) return false;

  return await db.query.admin.findFirst({
    where: eq(admin.userId, userId),
  });
});

async function resolveUserImage(
  rawImage: string | null | undefined,
): Promise<string | null> {
  if (!rawImage) return null;
  if (
    rawImage.startsWith("data:") ||
    (rawImage.startsWith("http") &&
      !rawImage.includes(process.env.S3_BUCKET ?? ""))
  ) {
    return rawImage;
  }
  try {
    const signed = await getFilenameUrl(rawImage);
    return signed || rawImage;
  } catch (err) {
    console.error("Error signing avatar image:", err);
    return rawImage;
  }
}

export async function getAllAdminUsers(): Promise<AdminUserItem[]> {
  const allUsers = await db.query.user.findMany({
    orderBy: (user, { desc }) => [desc(user.createdAt)],
  });

  const [candidates, recruiters, applications] = await Promise.all([
    db
      .select({
        userId: candidate.userId,
        recruitmentId: candidate.recruitmentId,
      })
      .from(candidate),
    db
      .select({
        userId: usersToRecruitments.userId,
        recruitmentId: usersToRecruitments.recruitmentId,
      })
      .from(usersToRecruitments),
    db
      .select({
        userId: application.candidateId,
        recruitmentId: application.recruitmentId,
      })
      .from(application),
  ]);

  const candidateRecruitmentsMap = new Map<string, Set<number>>();
  for (const row of [...candidates, ...applications]) {
    if (!row.userId || !row.recruitmentId) continue;
    if (!candidateRecruitmentsMap.has(row.userId)) {
      candidateRecruitmentsMap.set(row.userId, new Set());
    }
    candidateRecruitmentsMap.get(row.userId)!.add(row.recruitmentId);
  }

  const recruiterRecruitmentsMap = new Map<string, Set<number>>();
  for (const row of recruiters) {
    if (!row.userId || !row.recruitmentId) continue;
    if (!recruiterRecruitmentsMap.has(row.userId)) {
      recruiterRecruitmentsMap.set(row.userId, new Set());
    }
    recruiterRecruitmentsMap.get(row.userId)!.add(row.recruitmentId);
  }

  const usersWithSignedImages: AdminUserItem[] = await Promise.all(
    allUsers.map(async (u) => {
      const signedImage = await resolveUserImage(u.image);
      const candidateRecruitmentIds = Array.from(
        candidateRecruitmentsMap.get(u.id) ?? new Set<number>(),
      );
      const recruiterRecruitmentIds = Array.from(
        recruiterRecruitmentsMap.get(u.id) ?? new Set<number>(),
      );

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: signedImage,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        candidateRecruitmentIds,
        recruiterRecruitmentIds,
      };
    }),
  );

  return usersWithSignedImages;
}

export async function updateAdminUserProfile({
  userId,
  name,
  email,
  removeAvatar = false,
  avatarFile,
}: {
  userId: string;
  name: string;
  email: string;
  removeAvatar?: boolean;
  avatarFile?: File | null;
}) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!userId) {
    throw new Error("ID de utilizador inválido");
  }
  if (!trimmedName) {
    throw new Error("O nome é obrigatório");
  }
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("O email fornecido é inválido");
  }

  // Check if another user already has this email
  const existingWithEmail = await db.query.user.findFirst({
    where: and(eq(user.email, trimmedEmail), ne(user.id, userId)),
  });

  if (existingWithEmail) {
    throw new Error("Este email já se encontra em uso por outro utilizador");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    throw new Error("Utilizador não encontrado");
  }

  let finalImageKey: string | null = existingUser.image;

  if (removeAvatar) {
    if (existingUser.image) {
      try {
        await deleteFile(fromFullUrlToPath(existingUser.image));
      } catch (err) {
        console.error("Erro ao apagar avatar anterior:", err);
      }
    }
    finalImageKey = null;
    await db
      .update(user)
      .set({
        name: trimmedName,
        email: trimmedEmail,
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  } else if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
    const uploadRes = await uploadProfileImage(avatarFile, userId);
    if (!uploadRes.success) {
      throw new Error(
        uploadRes.error || "Falha ao carregar a imagem de perfil",
      );
    }
    finalImageKey = uploadRes.fileName ?? null;

    if (existingUser.image) {
      const oldKey = fromFullUrlToPath(existingUser.image);
      const newKey = uploadRes.fileName;
      if (newKey && oldKey !== newKey) {
        try {
          await deleteFile(oldKey);
        } catch (err) {
          console.error("Erro ao apagar avatar anterior:", err);
        }
      }
    }

    await db
      .update(user)
      .set({
        name: trimmedName,
        email: trimmedEmail,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  } else {
    await db
      .update(user)
      .set({
        name: trimmedName,
        email: trimmedEmail,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }

  const signedImage = await resolveUserImage(finalImageKey);

  return {
    id: userId,
    name: trimmedName,
    email: trimmedEmail,
    image: signedImage,
  };
}

export async function sendAdminUserPasswordReset(userId: string) {
  const target = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!target) {
    throw new Error("Utilizador não encontrado");
  }

  await auth.api.requestPasswordReset({
    body: {
      email: target.email,
      redirectTo: "/reset-password",
    },
    headers: await headers(),
  });

  return { success: true };
}

export async function deleteAdminUser({
  adminUserId,
  targetUserId,
  adminPassword,
}: {
  adminUserId: string;
  targetUserId: string;
  adminPassword: string;
}) {
  if (!targetUserId) {
    throw new Error("ID de utilizador inválido");
  }

  if (adminUserId === targetUserId) {
    throw new Error("Não podes eliminar a tua própria conta de administrador");
  }

  if (
    !adminPassword ||
    typeof adminPassword !== "string" ||
    !adminPassword.trim()
  ) {
    throw new Error("A palavra-passe de confirmação é obrigatória");
  }

  const adminEntry = await db.query.admin.findFirst({
    where: eq(admin.userId, adminUserId),
  });
  if (!adminEntry) {
    throw new Error("Privilégios de administrador necessários");
  }

  const adminAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, adminUserId), isNotNull(account.password)),
  });

  if (!adminAccount?.password) {
    throw new Error("Conta de administrador sem palavra-passe configurada");
  }

  const isValidPassword = await verifyPassword({
    hash: adminAccount.password,
    password: adminPassword,
  });

  if (!isValidPassword) {
    throw new Error("Palavra-passe de confirmação incorreta");
  }

  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, targetUserId),
  });

  if (!targetUser) {
    throw new Error("Utilizador não encontrado");
  }

  const avatarPathToDelete = targetUser.image;
  let cvPathsToDelete: string[] = [];

  const candidateInterviews = await db.query.interview.findMany({
    where: eq(interview.candidateId, targetUserId),
    columns: { id: true },
  });
  const interviewIds = candidateInterviews.map((i) => i.id);

  await db.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, targetUserId))
      .for("update");

    const userApplications = await tx
      .select({ id: application.id, curriculum: application.curriculum })
      .from(application)
      .where(eq(application.candidateId, targetUserId))
      .for("update");

    const appIds = userApplications.map((a) => a.id);
    cvPathsToDelete = userApplications
      .map((a) => a.curriculum)
      .filter((c): c is string => !!c);

    await tx.delete(notification).where(eq(notification.userId, targetUserId));

    const commentSubquery = tx
      .select({ id: sql`CAST(${applicationComment.id} AS text)` })
      .from(applicationComment)
      .leftJoin(
        application,
        eq(application.id, applicationComment.applicationId),
      )
      .where(
        or(
          eq(applicationComment.authorId, targetUserId),
          eq(application.candidateId, targetUserId),
        ),
      );

    await tx
      .delete(notification)
      .where(
        and(
          eq(notification.type, "mention"),
          inArray(sql`(${notification.data}->>'commentId')`, commentSubquery),
        ),
      );

    if (appIds.length > 0) {
      await tx
        .delete(applicationInterests)
        .where(inArray(applicationInterests.applicationId, appIds));
      await tx
        .delete(applicationToTag)
        .where(inArray(applicationToTag.applicationId, appIds));
      await tx
        .delete(appreciation)
        .where(inArray(appreciation.applicationId, appIds));
      await tx
        .delete(applicationComment)
        .where(inArray(applicationComment.applicationId, appIds));
      await tx
        .delete(application)
        .where(eq(application.candidateId, targetUserId));
    }

    await tx
      .delete(appreciation)
      .where(eq(appreciation.recruiterId, targetUserId));

    await tx
      .delete(applicationComment)
      .where(eq(applicationComment.authorId, targetUserId));
    await tx
      .delete(dynamicComment)
      .where(eq(dynamicComment.authorId, targetUserId));
    await tx
      .delete(interviewComment)
      .where(eq(interviewComment.authorId, targetUserId));

    await tx
      .update(votingPhaseStatus)
      .set({ candidateId: null })
      .where(eq(votingPhaseStatus.candidateId, targetUserId));

    await tx
      .delete(candidateVote)
      .where(eq(candidateVote.candidateId, targetUserId));

    await tx
      .delete(recruiterVote)
      .where(
        or(
          eq(recruiterVote.recruiterId, targetUserId),
          eq(recruiterVote.candidateId, targetUserId),
        ),
      );

    await tx
      .delete(votingPhaseCandidate)
      .where(eq(votingPhaseCandidate.candidateId, targetUserId));

    if (interviewIds.length > 0) {
      await tx
        .delete(interviewComment)
        .where(inArray(interviewComment.interviewId, interviewIds));
      await tx
        .delete(recruiterToInterview)
        .where(inArray(recruiterToInterview.interviewId, interviewIds));
      await tx.delete(interview).where(eq(interview.candidateId, targetUserId));
    }

    await tx
      .delete(recruiterToInterview)
      .where(eq(recruiterToInterview.recruiterId, targetUserId));

    await tx
      .delete(candidateToDynamic)
      .where(eq(candidateToDynamic.candidateId, targetUserId));
    await tx
      .delete(recruiterToDynamic)
      .where(eq(recruiterToDynamic.recruiterId, targetUserId));

    await tx
      .delete(recruiterToCandidate)
      .where(
        or(
          eq(recruiterToCandidate.recruiterId, targetUserId),
          eq(recruiterToCandidate.candidateId, targetUserId),
        ),
      );

    await tx
      .delete(recruiterAvailability)
      .where(eq(recruiterAvailability.recruiterId, targetUserId));

    await tx
      .delete(recruitmentPhaseStatus)
      .where(eq(recruitmentPhaseStatus.userId, targetUserId));

    await tx
      .delete(usersToRecruitments)
      .where(eq(usersToRecruitments.userId, targetUserId));

    await tx.delete(candidate).where(eq(candidate.userId, targetUserId));
    await tx.delete(recruiter).where(eq(recruiter.userId, targetUserId));
    await tx.delete(admin).where(eq(admin.userId, targetUserId));

    await tx.delete(session).where(eq(session.userId, targetUserId));
    await tx.delete(account).where(eq(account.userId, targetUserId));
    await tx
      .delete(verification)
      .where(eq(verification.identifier, targetUser.email));

    await tx.delete(user).where(eq(user.id, targetUserId));
  });

  if (avatarPathToDelete) {
    try {
      const deleted = await deleteFile(fromFullUrlToPath(avatarPathToDelete));
      if (!deleted) {
        console.error(
          `Erro ao apagar imagem de perfil no caminho: ${avatarPathToDelete}`,
        );
      }
    } catch (err) {
      console.error("Erro ao apagar imagem de perfil:", err);
    }
  }

  for (const cvPath of cvPathsToDelete) {
    try {
      const deleted = await deleteFile(fromFullUrlToPath(cvPath));
      if (!deleted) {
        console.error(`Erro ao apagar currículo no caminho: ${cvPath}`);
      }
    } catch (err) {
      console.error("Erro ao apagar currículo:", err);
    }
  }

  return { success: true, deletedUserId: targetUserId };
}
