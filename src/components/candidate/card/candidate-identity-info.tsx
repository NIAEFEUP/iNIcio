import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CandidateWithMetadata } from "@/lib/candidate";
import Link from "next/link";

interface CandidateIdentityInfoProps {
  candidate: CandidateWithMetadata;
  fullDetails?: boolean;
}

export default function CandidateIdentityInfo({
  candidate,
  fullDetails = false,
}: CandidateIdentityInfoProps) {
  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <Avatar className="h-20 w-20 ring-4 ring-primary/10 ring-offset-4 ring-offset-background transition-all duration-300 group-hover:ring-primary/20">
          <AvatarImage
            src={candidate?.application?.profilePicture || "/placeholder.svg"}
            alt={candidate?.name}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-semibold">
            {candidate?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/candidate/${candidate?.id}`}
          className="group/link inline-block"
        >
          <h3 className="text-lg font-bold tracking-tight text-foreground group-hover/link:text-primary transition-colors duration-200 text-balance">
            {candidate?.name}
          </h3>
          <div className="h-0.5 w-0 bg-primary group-hover/link:w-full transition-all duration-300 mt-1" />
        </Link>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          {candidate?.application?.studentNumber}
        </p>
        {fullDetails && (
          <>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {candidate.application?.phone}
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {candidate.email}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
