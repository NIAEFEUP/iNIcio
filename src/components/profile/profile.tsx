"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useSession } from "@/lib/use-session";

interface ProfileProps {
  pictureUrl: string | null;
}

export default function Profile({ pictureUrl }: ProfileProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null;
  }

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-8">
        <div className="flex gap-8 mb-8 p-6 bg-muted/30 rounded-lg">
          <Avatar className="h-32 w-32 ring-4 ring-primary/10 ring-offset-4 ring-offset-background">
            <AvatarImage
              src={pictureUrl || "/professional-student-portrait.png"}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
