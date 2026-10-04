import { cn } from "@/lib/utils";

interface EvaluationLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarClassName?: string;
}

export function EvaluationLayout({
  header,
  sidebar,
  children,
  className,
  sidebarClassName,
}: EvaluationLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-4 flex-1 h-full min-h-0", className)}>
      {header}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 xl:grid-cols-6 flex-1 h-full min-h-0">
        <aside
          className={cn(
            "space-y-6 lg:col-span-2 lg:h-full lg:flex lg:flex-col min-h-0",
            sidebarClassName,
          )}
        >
          {sidebar}
        </aside>
        <section className="min-w-0 w-full lg:col-span-3 xl:col-span-4 flex flex-col flex-1 h-full min-h-0">
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
        "flex-1 h-full min-h-105 flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}
