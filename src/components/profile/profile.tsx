"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStableImageUrl } from "@/lib/stable-image-url";
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
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <Avatar className="size-24 sm:size-28 ring-4 ring-primary/10 ring-offset-2 ring-offset-background shrink-0">
          <AvatarImage
            src={
              getStableImageUrl(pictureUrl) ||
              "/professional-student-portrait.png"
            }
            alt={session?.user?.name || "Profile"}
          />
          <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">
            {session?.user?.name}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground break-all">
            {session?.user?.email}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
