import { Skeleton } from "@/components/ui/skeleton";

interface EvaluationSkeletonProps {
  showInterviewers?: boolean;
  contentCardsCount?: number;
}

export function EvaluationSkeleton({
  showInterviewers = false,
  contentCardsCount = 3,
}: EvaluationSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-6">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="border-t pt-4">
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          {showInterviewers && <Skeleton className="h-20 w-full rounded-xl" />}
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="lg:col-span-3 xl:col-span-4">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: contentCardsCount }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
