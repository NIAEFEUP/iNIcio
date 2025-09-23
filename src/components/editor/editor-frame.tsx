import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function EditorFrame({ children }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Editor de Texto
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full overflow-y-auto">
        <div className="space-y-4 h-full flex flex-col">{children}</div>
      </CardContent>
    </Card>
  );
}
