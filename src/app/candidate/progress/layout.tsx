import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { redirect } from "next/navigation";

export default async function CandidateProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    return redirect("/login");
  }

  if (await isRecruiter(session.user.id)) {
    return redirect("/recruiter");
  }

  return <>{children}</>;
}
