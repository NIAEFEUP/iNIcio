import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  return (
    <Card key={title} className="w-full">
      <Collapsible
        open={openItems.includes(id)}
        onOpenChange={() => toggleItem(id)}
      >
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-left font-bold text-foreground">
                {title}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  openItems.includes(id) ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="border-t pt-4">
              <p className="text-muted-foreground leading-relaxed">{content}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
