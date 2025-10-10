import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header skeleton */}
      <div className="text-center mb-4">
        <Skeleton className="h-8 w-32 mx-auto" />
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mx-auto w-full max-w-[80em]">
        <Skeleton className="h-10 w-full md:w-128 mx-4" />
        <div className="flex flex-row flex-wrap items-center gap-4 mx-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Candidates grid skeleton */}
      <div className="mx-auto w-full max-w-[80em] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-4 border rounded-lg bg-card"
          >
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <div className="flex gap-2 justify-center mt-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
