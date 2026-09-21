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
    <Tabs defaultValue={defaultValue} className={cn("w-full", className)}>
      <TabsList className="w-full">
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
            {tab.label}
            {typeof tab.count === "number" && ` (${tab.count})`}
          </TabsTrigger>
        ))}
      </TabsList>
      {visibleTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="w-full">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
