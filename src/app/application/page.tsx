import ApplicationClient from "@/components/application/application-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Application() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <ApplicationClient />;
}
