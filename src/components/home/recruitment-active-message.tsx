"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Link, Target, TrendingUp } from "lucide-react";

export default function RecruitmentActiveMessage() {
  const { data: session } = authClient.useSession();

  return (
    <>
      {!session ? (
        <>
          <h1 className="font-bold text-5xl px-5 lg:text-9xl md:w-1/2 text-center">
            Queres fazer parte do <span className="text-primary">NIAEFEUP</span>
            ?
          </h1>
          <div className="flex flex-col lg:flex-row justify-center lg:gap-5">
            <Button size="lg" className="mt-10">
              <a href="signup">Regista-te →</a>
            </Button>
            <Button size="lg" variant="outline" className="mt-10" asChild>
              <a
                href="https://niaefeup.pt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visita o nosso site !
              </a>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="max-w-lg text-center flex flex-col gap-4 my-32">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                  <Target className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-accent-foreground" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground text-balance ">
                Continua o teu progresso
              </h2>
              <p className="text-base text-muted-foreground text-balance leading-relaxed">
                Para continuares a tua jornada no recrutamento, precisas de
                completar todas as fases na página de progresso, caso ainda não
                o tenhas feito!{" "}
              </p>
            </div>
            <Button>Ver progresso</Button>
          </div>
        </>
      )}
    </>
  );
}
