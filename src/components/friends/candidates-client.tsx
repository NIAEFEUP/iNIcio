"use client";

import FriendChooseCard from "@/components/friends/friend-choose-card";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/db";
import { useEffect, useState } from "react";

interface CandidatesClientProps {
  candidates: Array<User>;
  friends: Array<User>;
}

export default function CandidatesClient({
  candidates,
  friends,
}: CandidatesClientProps) {
  const [query, setQuery] = useState<string>("");

  const [filteredCandidates, setFilteredCandidates] =
    useState<Array<User>>(candidates);

  useEffect(() => {
    if (!query.trim()) setFilteredCandidates(candidates);

    setFilteredCandidates(
      candidates.filter((c) =>
        c.name.toLowerCase().trim().includes(query.toLowerCase().trim()),
      ),
    );
  }, [query, candidates]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between mx-64">
        <Input
          placeholder="Pesquisar"
          className="w-128"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        ></Input>
        <div className="flex flex-row"></div>
      </div>
      <div className="mx-64 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCandidates.map((candidate: User) => (
          <FriendChooseCard
            key={candidate.id}
            candidate={candidate}
            friends={friends}
          />
        ))}

        {filteredCandidates.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            Nenhum resultado encontrado
          </p>
        )}
      </div>
    </div>
  );
}
