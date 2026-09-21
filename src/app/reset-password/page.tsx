import ResetPasswordForm from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <ResetPasswordForm
      token={params.token}
      hasInvalidToken={params.error === "INVALID_TOKEN"}
    />
  );
}
