"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Users, UserPlus, X, Check } from "lucide-react";
import { useAvailableRecruiters } from "@/lib/hooks/use-available-recruiters";
import { Dynamic, Interview, RecruiterToCandidate, User } from "@/lib/db";
import { getDateStringPT, getTimeString } from "@/lib/date";
import { assignRecruiter, unassignRecruiter } from "@/app/actions";
import { SlotType } from "../admin/slot-admin-calendar";

interface BookingPickerProps {
  start: Date;
  duration: number;
  booking: (Interview | Dynamic) & { recruiters: RecruiterToCandidate[] };
  candidates: User[];
  type: SlotType;
}

interface RecruiterData {
  knownCandidates: { candidateId: string }[];
}

interface UserWithRecruiter extends User {
  recruiter?: RecruiterData;
}

export function BookingPicker({
  start,
  duration,
  booking,
  candidates,
  type,
}: BookingPickerProps) {
  console.log("BOOKING2: ", booking);
  console.log("BOOKING RECRUITERS: ", booking.recruiters);

  const { recruiters } = useAvailableRecruiters(
    start,
    new Date(start.getTime() + duration * 60 * 1000),
  );

  console.log("RECRUITERS: ", recruiters);

  const [selectedRecruiter] = useState("");
  const [selectedRecruiters, setSelectedRecruiters] = useState<any[]>(
    booking.recruiters.map((r) => r.recruiter),
  );
  const [isAddingInterviewer, setIsAddingInterviewer] = useState(false);

  const addInterviewer = async (interviewerId: string) => {
    const interviewer = recruiters.find((i) => i.id === interviewerId);
    setSelectedRecruiters([...selectedRecruiters, interviewer]);

    await assignRecruiter(booking.id, interviewerId, type);
  };

  const removeInterviewer = async (interviewerId: string) => {
    setSelectedRecruiters(
      selectedRecruiters.filter((i) => i.id !== interviewerId),
    );

    await unassignRecruiter(booking.id, interviewerId, type);
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {`${getDateStringPT(start)} às ${getTimeString(start)}`}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            Candidato
          </div>
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center gap-3 rounded-lg bg-muted p-2"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={candidate.image || "/placeholder.svg"}
                    alt={candidate.name}
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">
                    {candidate.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {candidate.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span>Recrutadores ({selectedRecruiters.length})</span>
            </div>
          </div>

          {selectedRecruiters.length > 0 && (
            <div className="space-y-2">
              {selectedRecruiters.map((interviewer) => {
                const quantity =
                  interviewer.interviews.length + interviewer.dynamics.length;
                return (
                  <div
                    key={interviewer.user.id}
                    className="flex items-center gap-2 rounded-lg border bg-card p-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {interviewer.user.name} ({quantity})
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => removeInterviewer(interviewer.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {isAddingInterviewer ? (
            <Select
              value={selectedRecruiter}
              onValueChange={(value) => addInterviewer(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an interviewer" />
              </SelectTrigger>
              <SelectContent>
                {recruiters
                  .filter(
                    (interviewer) =>
                      !selectedRecruiters.some((r) => r.id === interviewer.id),
                  )
                  .map((interviewer) => {
                    const quantity =
                      interviewer.recruiter.interviews?.length +
                      interviewer.recruiter.dynamics?.length;
                    console.log("INTERVIEWER ADDING: ", interviewer);
                    return (
                      <SelectItem key={interviewer.id} value={interviewer.id}>
                        <div className="flex flex-row gap-1">
                          <span className="font-medium">
                            {interviewer.name}
                          </span>

                          <span className="text-sm">{quantity}</span>

                          <span className="text-sm">
                            (
                            {(
                              interviewer as UserWithRecruiter
                            ).recruiter?.knownCandidates.filter((c) =>
                              candidates.find(
                                (candidate) => candidate.id === c.candidateId,
                              ),
                            ).length > 0
                              ? "Conheçe"
                              : "Não conheço"}
                            )
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => setIsAddingInterviewer(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Interviewer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
