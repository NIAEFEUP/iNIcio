"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import Link from "next/link";
import SignedRecruitmentActiveMessage from "./signed-recruitment-active-message";
import { User } from "@/lib/db";

interface RecruitmentActiveMessageProps {
  isRecruiter: boolean;
  user: User;
}

export default function RecruitmentActiveMessage({
  isRecruiter,
  user,
}: RecruitmentActiveMessageProps) {
  return (
    <>
      {!user ? (
        <>
          <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 w-full h-full">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
                  Queres fazer parte do{" "}
                  <span className="text-primary">NIAEFEUP</span>
                  <span className="text-foreground">?</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
                  Junta-te à maior comunidade de estudantes de informática da
                  FEUP. Conecta-te, aprende e cresce connosco numa jornada
                  incrível de descoberta tecnológica.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="default" variant="secondary">
                    <Link href="/signup">Regista-te agora</Link>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="default" size="default">
                    <Link href="https://niaefeup.pt">Visita o nosso site</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
          </section>
        </>
      ) : (
        <SignedRecruitmentActiveMessage isRecruiter={isRecruiter} />
      )}
    </>
  );
}
