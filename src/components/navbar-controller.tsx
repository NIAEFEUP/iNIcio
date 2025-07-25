"use server";

import { auth } from "@/lib/auth";
import Navbar from "./navbar";
import { headers } from "next/headers";

export default async function NavbarController() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <Navbar user={session ? session.user : null} />;
}
