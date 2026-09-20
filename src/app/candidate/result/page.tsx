import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/final-messages";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16 sm:py-24 text-center max-w-2xl mx-auto space-y-8">
      <Link
        href="/candidate/progress"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground hover:text-foreground gap-1.5 text-xs",
        )}
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao Progresso
      </Link>

      {!result ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Em Deliberação
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            A tua candidatura está em avaliação.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A equipa de recrutamento está a concluir a análise de todas as
            etapas. Assim que o resultado for publicado, terás acesso aqui e
            serás notificado por email.
          </p>
        </div>
      ) : isApproved ? (
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Parabéns!
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            Foste aceite no NIAEFEUP.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Bem-vindo/a à equipa! Estamos muito entusiasmados por começares a
            trabalhar connosco. Nos próximos dias entraremos em contacto por
            email com todos os detalhes sobre a tua integração e o arranque nos
            projetos.
          </p>

          {content && content.length > 0 && (
            <div className="text-left text-sm text-foreground bg-muted/20 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto">
              <ReadOnlyBlocks blocks={content as any} />
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-8 h-12 gap-2",
              )}
            >
              Ir para a Página Inicial
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Decisão do Recrutamento
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Obrigado pelo teu interesse e dedicação.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Infelizmente, devido ao número limitado de vagas neste ciclo, não
            foi possível selecionar a tua candidatura. Queremos agradecer
            sinceramente todo o teu tempo e encorajar-te a participar nos
            eventos, conferências e futuros recrutamentos do NIAEFEUP.
          </p>

          {content && content.length > 0 && (
            <div className="text-left text-sm text-foreground bg-muted/20 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto">
              <ReadOnlyBlocks blocks={content as any} />
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "text-base px-8 h-12",
              )}
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
