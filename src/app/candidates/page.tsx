import CandidatesClient from "@/components/candidates/candidates-client";
import { auth } from "@/lib/auth";
import { getAllCandidatesWithDynamic } from "@/lib/dynamic";
import { getFriendsOf } from "@/lib/friend";
import { headers } from "next/headers";

export default async function Friends() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const candidates = await getAllCandidatesWithDynamic();
  const friends = await getFriendsOf(session ? session.user.id : "");

  return <CandidatesClient candidates={candidates} friends={friends} />;
}
