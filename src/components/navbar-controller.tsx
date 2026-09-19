"use server";

import { headers } from "next/headers";
import Navbar from "./navbar";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { isCandidate } from "@/lib/candidate";
import { getNotifications } from "@/lib/notifications";

export default async function NavbarController() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const admin = await isAdmin(session?.user.id);
  const recruiter = await isRecruiter(session?.user.id);
  const candidate = await isCandidate(session?.user.id);

  const notifications = await getNotifications(session?.user.id);

  return (
    <Navbar
      isAdmin={admin ? true : false}
      isRecruiter={recruiter ? true : false}
      isCandidate={candidate ? true : false}
      notifications={notifications}
    />
  );
}
