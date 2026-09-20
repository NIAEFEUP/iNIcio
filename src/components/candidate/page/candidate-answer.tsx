import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function CandidateAnswer({
  id,
  title,
  content,
  openItems,
  toggleItem,
}: {
  id: number;
  title: string;
  content: string;
  openItems: number[];
  toggleItem: (id: number) => void;
}) {
  const open = openItems.includes(id);

  return (
    <Card key={title} className="w-full shadow-xs">
      <Collapsible open={open} onOpenChange={() => toggleItem(id)}>
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3 w-full">
              <span className="text-left font-semibold text-foreground">
                {title}
              </span>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/60 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180",
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="border-t pt-4">
              <p
                className={cn(
                  "leading-relaxed transition-colors",
                  content
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60 italic",
                )}
              >
                {content || "Sem resposta."}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
