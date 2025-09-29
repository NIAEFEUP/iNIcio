import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CandidateProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect("/login");
  }

  if (await isRecruiter(session.user.id)) {
    return redirect("/recruiter/progress");
  }

  return <>{children}</>;
}
