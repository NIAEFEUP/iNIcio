import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  if (!isRecruiter(session?.user.id) && !isAdmin(session?.user.id)) {
    return redirect("/");
  }

  return <>{children}</>;
}
