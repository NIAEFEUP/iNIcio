import {
  admin,
  application,
  candidate,
  user,
  usersToRecruitments,
} from "@/db/schema";
import { db } from "./db";
import { and, eq, ne } from "drizzle-orm";
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
