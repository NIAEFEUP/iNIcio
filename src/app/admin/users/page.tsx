import UserAdminClient from "@/components/admin/user-admin-client";
import {
  getAllAdminUsers,
  sendAdminUserPasswordReset,
  updateAdminUserProfile,
} from "@/lib/admin";
import { getRecruitments } from "@/lib/recruitment";
import { requireAdminSession } from "@/lib/action-guard";

export const metadata = {
  title: "Gestão de Utilizadores | Admin",
  description: "Gestão de contas e perfis de utilizadores da plataforma",
};

export default async function AdminUsersPage() {
  await requireAdminSession();

  const [users, recruitments] = await Promise.all([
    getAllAdminUsers(),
    getRecruitments(),
  ]);

  async function updateUserAction(formData: FormData) {
    "use server";
    await requireAdminSession();

    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const removeAvatar = formData.get("removeAvatar") === "true";
    const avatarFile = formData.get("avatar") as File | null;

    try {
      const updated = await updateAdminUserProfile({
        userId,
        name,
        email,
        removeAvatar,
        avatarFile,
      });

      return {
        success: true,
        user: updated,
      };
    } catch (err) {
      console.error("Error updating user:", err);
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao atualizar o utilizador",
      };
    }
  }

  async function sendResetPasswordEmailAction(userId: string) {
    "use server";
    await requireAdminSession();

    try {
      await sendAdminUserPasswordReset(userId);
      return { success: true };
    } catch (err) {
      console.error("Error sending password reset email:", err);
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Falha ao enviar email de recuperação",
      };
    }
  }

  return (
    <UserAdminClient
      users={users}
      recruitments={recruitments}
      updateUser={updateUserAction}
      sendPasswordResetEmail={sendResetPasswordEmailAction}
    />
  );
}
