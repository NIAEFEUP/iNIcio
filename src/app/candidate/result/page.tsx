import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  HeartHandshake,
  ArrowLeft,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/final-messages";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function ResultPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getMessage(session.user.id);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-2xl text-center space-y-6">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Clock className="size-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs font-normal">
            Em Avaliação
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Resultado Pendente
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            As deliberações do processo de recrutamento ainda estão a decorrer.
            Verifica novamente mais tarde ou fica atento ao teu email.
          </p>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/candidate/progress" />}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Voltar ao Progresso
          </Button>
        </div>
      </div>
    );
  }

  const content = (result.message?.content ?? []) as Array<unknown>;
  const isApproved = result.decision === "approved";

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/candidate/progress" />}
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao Progresso
        </Button>
      </div>

      <Card
        className={
          isApproved ? "border-primary/40 shadow-sm" : "border-border shadow-sm"
        }
      >
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto mb-4">
            {isApproved ? (
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="size-8 text-primary" />
              </div>
            ) : (
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <HeartHandshake className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex justify-center mb-2">
            {isApproved ? (
              <Badge
                variant="default"
                className="gap-1.5 py-1 px-3 text-xs font-normal"
              >
                <CheckCircle2 className="size-3.5" />
                Candidatura Aceite
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-3 text-xs font-normal"
              >
                Resultado Final
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
            {isApproved
              ? "Parabéns! Foste aceite no NIAEFEUP"
              : "Resultado do Recrutamento"}
          </CardTitle>
          <CardDescription className="text-sm md:text-base max-w-lg mx-auto">
            {isApproved
              ? "Estamos entusiasmados por te dar as boas-vindas à nossa equipa!"
              : "Agradecemos profundamente a tua dedicação e interesse em juntares-te ao núcleo."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-4">
          <div className="rounded-lg border border-border bg-card p-6 md:p-8">
            <ReadOnlyBlocks blocks={content} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
