import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user) {
    redirect("/");
  }

  return <>{children}</>;
}
