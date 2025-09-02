import FriendChooseCard from "@/components/friends/friend-choose-card";
import { candidate, recruiterToCandidate } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db, getAllCandidateUsers } from "@/lib/db";

import { eq } from "drizzle-orm";

import { headers } from "next/headers";

export default async function Friends() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const candidates = await getAllCandidateUsers();

  const friends = await db
    .select()
    .from(recruiterToCandidate)
    .where(
      eq(recruiterToCandidate.recruiterId, session ? session.user.id : ""),
    );

  return (
    <div className="m-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {candidates.map((candidate) => (
        <FriendChooseCard
          key={candidate.id}
          candidate={candidate}
          friends={friends}
        />
      ))}
    </div>
  );
}
