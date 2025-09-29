export const dynamic = "force-dynamic";

import { isRecruitmentActive } from "@/lib/recruitment";
import "./globals.css";

import RecruitmentActiveMessage from "@/components/home/recruitment-active-message";

import { Clock } from "lucide-react";
import { isCandidate } from "@/lib/candidate";
import { isRecruiter } from "@/lib/recruiter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const recruitmentActive = await isRecruitmentActive();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const recruiter = await isRecruiter(session?.user.id);

  return (
    <div className="h-full flex flex-col items-center">
      {recruitmentActive ? (
        <>
          <RecruitmentActiveMessage isRecruiter={recruiter} />
        </>
      ) : (
        <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 w-full h-full">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              {/* Status indicator */}
              <div className="inline-flex items-center gap-2 bg-muted/50 text-muted-foreground px-4 py-2 rounded-full text-sm mb-8">
                <Clock className="h-4 w-4" />
                Estado do Recrutamento
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
                De momento <span className="text-primary">não</span> estamos
                <br />
                <span className="text-foreground">a recrutar</span>
              </h1>

              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">😔</span>
                </div>
              </div>

              <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
                Se tiveres interesse em juntar-te à equipa do{" "}
                <span className="text-primary font-semibold">NIAEFEUP</span>,
                contacta-nos para saberes quando vamos abrir o próximo
                recrutamento.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
        </section>
      )}
    </div>
  );
}
