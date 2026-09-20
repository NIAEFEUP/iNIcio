import { cn } from "@/lib/utils";

interface EvaluationLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function EvaluationLayout({
  header,
  sidebar,
  children,
  className,
}: EvaluationLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 xl:grid-cols-6">
        <aside className="space-y-6 lg:col-span-2">{sidebar}</aside>
        <section className="min-w-0 w-full lg:col-span-3 xl:col-span-4">
          {children}
        </section>
      </div>
    </div>
  );
}

export function EvaluationPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[calc(100dvh-16rem)] min-h-105 flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}
