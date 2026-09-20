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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ResultPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getMessage(session.user.id);
  const isApproved = result?.decision === "approved";
  const content = (result?.message?.content ?? []) as Array<unknown>;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row items-stretch">
      {/* Left Column: Context & Overall Decision */}
      <div className="w-full lg:w-5/12 xl:w-4/12 p-6 sm:p-8 lg:p-12 lg:border-r border-border bg-muted/15 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          <Link
            href="/candidate/progress"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 text-muted-foreground hover:text-foreground gap-1.5 w-fit text-xs",
            )}
          >
            <ArrowLeft className="size-4" />
            Voltar ao Progresso
          </Link>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Recrutamento NIAEFEUP
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Resultado Final
            </h1>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {!result
              ? "As deliberações do processo de seleção ainda estão a decorrer pela equipa de recrutamento. Fica atento a esta página ou ao teu email para saberes a decisão."
              : isApproved
                ? "Parabéns! A tua candidatura foi aceite. Estamos entusiasmados por começar a trabalhar contigo e integrar-te nos projetos do núcleo."
                : "Agradecemos profundamente todo o teu tempo, dedicação e entusiasmo ao longo de todas as etapas deste recrutamento."}
          </p>

          {/* Clean status card - NO badge spam */}
          <div className="rounded-xl border p-4 bg-card shadow-xs">
            {!result ? (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Em Avaliação
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deliberações ainda em curso
                  </p>
                </div>
              </div>
            ) : isApproved ? (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Candidatura Aceite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bem-vindo à equipa do NIAEFEUP
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <HeartHandshake className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Processo Concluído
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Obrigado pela tua participação
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Tens alguma questão ou queres deixar feedback?
          </p>
          <p>
            Fala connosco através de{" "}
            <a
              href="mailto:geral@ni.fe.up.pt"
              className="underline hover:text-foreground"
            >
              geral@ni.fe.up.pt
            </a>{" "}
            ou no Instagram{" "}
            <a
              href="https://instagram.com/niaefeup"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              @niaefeup
            </a>
            .
          </p>
        </div>
      </div>

      {/* Right Column: Decision & Feedback Details */}
      <div className="w-full lg:w-7/12 xl:w-8/12 p-6 sm:p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto">
          {!result ? (
            <Card className="border-border bg-card">
              <CardHeader className="text-center pb-4 pt-8 space-y-3">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <Clock className="size-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-foreground">
                    Decisão em Processamento
                  </CardTitle>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    A equipa de recrutamento está a concluir as reuniões de
                    deliberação. A resposta final será publicada nesta página
                    assim que o processo estiver concluído.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pb-8 text-center">
                <Link
                  href="/candidate/progress"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Voltar ao Progresso
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card
              className={cn(
                "border bg-card shadow-xs",
                isApproved
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border",
              )}
            >
              <CardHeader className="pb-4 pt-8">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center shrink-0",
                      isApproved
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isApproved ? (
                      <Sparkles className="size-5" />
                    ) : (
                      <HeartHandshake className="size-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                      {isApproved
                        ? "Bem-vindo ao NIAEFEUP!"
                        : "Mensagem da Equipa de Recrutamento"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isApproved
                        ? "Mensagem oficial de boas-vindas e próximos passos"
                        : "Comunicação relativa à tua candidatura"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pb-8">
                <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 text-sm text-foreground">
                  <ReadOnlyBlocks blocks={content} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href="/candidate/progress"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    Voltar ao Progresso
                  </Link>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                    )}
                  >
                    Página Inicial
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
