import { admin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = await db.query.admin.findFirst({
    where: eq(admin.userId, session.user.id),
  });

  if (!isAdmin) {
    return redirect("/");
  }

  return <>{children}</>;
}
