import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface NotRecruitingMessageProps {
  /** When the next recruitment starts, if one is upcoming. */
  nextStart?: Date | null;
}

export default function NotRecruitingMessage({
  nextStart,
}: NotRecruitingMessageProps) {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-2xl text-center">
      <div className="flex flex-col items-center space-y-4">
        <Badge
          variant="outline"
          className="gap-1.5 py-1 px-3 text-xs font-medium"
        >
          <Calendar className="size-3.5 text-muted-foreground" />
          Estado do Recrutamento
        </Badge>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
          De momento não estamos a recrutar
        </h1>

        <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-lg mx-auto leading-relaxed">
          Se tens interesse em juntar-te ao NIAEFEUP, acompanha os nossos canais
          ou contacta-nos para saberes quando abrirá o próximo período de
          admissão.
        </p>

        {nextStart && (
          <Card className="w-full text-left mt-4">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Próximo Recrutamento
                </CardTitle>
                <CardDescription className="text-xs">
                  Arranque previsto a{" "}
                  <strong className="text-foreground font-medium">
                    {nextStart.toLocaleString("pt-PT")}
                  </strong>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="pt-8">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4" />
            <span>NIAEFEUP — Núcleo de Informática da AEFEP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
