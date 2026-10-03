import { cookies } from "next/headers";
import UserAdminClient from "@/components/admin/user-admin-client";
import {
  deleteAdminUser,
  getAllAdminUsers,
  sendAdminUserPasswordReset,
  updateAdminUserProfile,
} from "@/lib/admin";
import { getRecruitments } from "@/lib/recruitment";
import { requireAdminSession } from "@/lib/action-guard";
import { USERS_VIEW_MODE_COOKIE_NAME } from "@/constants/cookies.const";

export const metadata = {
  title: "Gestão de Utilizadores | Admin",
  description: "Gestão de contas e perfis de utilizadores da plataforma",
};

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdminSession();
  const cookieStore = await cookies();
  const initialViewMode =
    cookieStore.get(USERS_VIEW_MODE_COOKIE_NAME)?.value === "grid"
      ? "grid"
      : "list";

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

  async function deleteUserAction(targetUserId: string, adminPassword: string) {
    "use server";
    const adminUser = await requireAdminSession();

    try {
      await deleteAdminUser({
        adminUserId: adminUser.id,
        targetUserId,
        adminPassword,
      });

      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao eliminar o utilizador",
      };
    }
  }

  return (
    <UserAdminClient
      initialViewMode={initialViewMode}
      users={users}
      recruitments={recruitments}
      currentUserId={currentAdmin.id}
      updateUser={updateUserAction}
      deleteUser={deleteUserAction}
      sendPasswordResetEmail={sendResetPasswordEmailAction}
    />
  );
}
