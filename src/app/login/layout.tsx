"use client";

import { useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";
import { useSession } from "@/lib/use-session";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const addAccount = searchParams.get("addAccount") === "1";
  const { data: session, isPending } = useSession();

  if (!addAccount && isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session?.user && !addAccount) {
    redirect("/");
  }

  return <>{children}</>;
}
