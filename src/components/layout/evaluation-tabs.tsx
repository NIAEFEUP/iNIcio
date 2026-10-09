"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface EvaluationTabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  count?: number;
  hidden?: boolean;
}

interface EvaluationTabsProps {
  defaultValue: string;
  tabs: EvaluationTabItem[];
  className?: string;
}

export function EvaluationTabs({
  defaultValue,
  tabs,
  className,
}: EvaluationTabsProps) {
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <Tabs
      defaultValue={defaultValue}
      className={cn(
        "w-full lg:flex-1 lg:h-full flex flex-col min-h-0",
        className,
      )}
    >
      <TabsList className="w-full shrink-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex-1 min-w-0">
            <span className="truncate">
              {tab.label}
              {typeof tab.count === "number" && ` (${tab.count})`}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {visibleTabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="w-full lg:flex-1 lg:h-full flex flex-col min-h-0 mt-2.5 data-[state=inactive]:hidden"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
