import { getApplication } from "@/lib/application";
import { auth } from "@/lib/auth";
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

  const application = await getApplication(session?.user.id);

  if (!application) {
    return redirect("/application");
  }

  if (session?.user.role !== "candidate") {
    return redirect("/");
  }

  return <>{children}</>;
}
