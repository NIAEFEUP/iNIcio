import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center min-h-[50vh] w-full py-12",
        className,
      )}
    >
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}

export default PageLoading;
