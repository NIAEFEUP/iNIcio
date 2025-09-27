"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";
import { Application } from "@/lib/db";
import { authClient } from "@/lib/auth-client";
import CandidateAnswer from "../candidate/page/candidate-answer";

interface ProfileProps {
  application: Application | null | undefined;
  applicationInterests: string[];
}

export default function Profile({
  application,
  applicationInterests,
}: ProfileProps) {
  const { data: session } = authClient.useSession();

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-8">
        <div className="flex gap-8 mb-8 p-6 bg-muted/30 rounded-lg">
          <Avatar className="w-28 h-28 ring-2 ring-primary/20">
            <AvatarImage
              src={session?.user?.image || "/professional-student-portrait.png"}
              alt={session?.user?.name || "Profile"}
            />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-bold text-card-foreground">
              {session?.user?.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Curso:
                </span>
                <span className="text-sm font-semibold text-card-foreground uppercase">
                  {application?.degree}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Ano:
                </span>
                <span className="text-sm font-semibold text-card-foreground">
                  {application?.curricularYear}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Departamentos:
              </span>
              <div className="flex gap-2 flex-wrap">
                {applicationInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <CandidateAnswer
            title="Interesse nas escolhas"
            content={application ? application.interestJustification : ""}
          />

          <CandidateAnswer
            title="Porquê o NI?"
            content={application ? application.motivation : ""}
          />

          <CandidateAnswer
            title="O que poderíamos ganhar contigo?"
            content={application ? application.selfPromotion : ""}
          />

          <CandidateAnswer
            title="Tens alguma sugestão?"
            content={application ? application.suggestions : ""}
          />

          <CandidateAnswer
            title="Com que tecnologias/ferramentas já trabalhaste?"
            content={application ? application.experience : ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}
