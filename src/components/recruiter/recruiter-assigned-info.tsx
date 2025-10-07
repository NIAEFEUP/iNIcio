"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { User } from "@/lib/db";

interface RecruierAssignedProps {
  interviewers: Array<User>;
}

export default function CandidateQuickInfo({
  interviewers,
}: RecruierAssignedProps) {
  console.log(interviewers);
  interviewers = [...interviewers, ...interviewers, ...interviewers];

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-accent/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="font-bold ">Entrevistadores</CardHeader>
      <CardContent className="grid grid-cols-2">
        {interviewers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum entrevistador atribuído.
          </p>
        )}
        {interviewers.map((interviewer) => (
          <div
            key={interviewer.id}
            className="flex flex-row items-center space-x-4 mb-4"
          >
            <Avatar>
              <AvatarImage
                src={interviewer.image || undefined}
                alt={interviewer.name || "Entrevistador"}
              />
              <AvatarFallback>
                {interviewer.name ? interviewer.name.split(" ")[0][0] : "NA"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {interviewer.name
                  ? interviewer.name.split(" ").length > 2
                    ? `${interviewer.name.split(" ")[0]} ${interviewer.name.split(" ").slice(-1)}`
                    : interviewer.name
                  : "Entrevistador"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
