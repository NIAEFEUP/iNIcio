import { ResetPasswordForm } from "@/components/reset-password/reset-password-form";
import { auth } from "@/lib/auth";

export default function Page() {
  const sendResetPassword = async (email: string) => {
    "use server";

    const data = await auth.api.requestPasswordReset({
      body: {
        redirectTo: "https://example.com/reset-password",
      },
    });
  };

  return (
    <div className="flex items-center justify-center">
      <ResetPasswordForm sendResetPassword={sendResetPassword} />
    </div>
  );
}
