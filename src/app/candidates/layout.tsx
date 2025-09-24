import { auth } from "@/lib/auth";
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
  //
  // if (session?.user.role !== "recruiter" && session?.user.role !== "admin") {
  //   return redirect("/");
  // }
  //
  return <>{children}</>;
}
