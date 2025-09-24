"use server";

import { headers } from "next/headers";
import Navbar from "./navbar";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

export default async function NavbarController() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const admin = await isAdmin(session?.user.id);

  return <Navbar isAdmin={admin ? true : false} />;
}
