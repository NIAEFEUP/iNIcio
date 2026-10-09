import { Spinner } from "@/components/ui/spinner";

export interface DataLoadingStateProps {
  message?: string;
}

export function DataLoadingState({ message }: DataLoadingStateProps) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
      <Spinner className="size-6 text-muted-foreground" />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

export interface DataErrorStateProps {
  title?: string;
  message?: string;
}

export function DataErrorState({
  title = "Failed to load data",
  message,
}: DataErrorStateProps) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed border-rose-200 p-6 text-center bg-rose-50/10 dark:bg-rose-950/10">
      <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
        {title}
      </p>
      {message && (
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      )}
    </div>
  );
}

export interface DataEmptyStateProps {
  title?: string;
  description?: string;
}

export function DataEmptyState({
  title = "No results found",
  description = "Try adjusting your search query or filters to find what you're looking for.",
}: DataEmptyStateProps) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
