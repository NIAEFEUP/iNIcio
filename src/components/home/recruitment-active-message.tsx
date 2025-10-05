"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

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
                  <span className="text-red-600 relative inline-block">
                    NIAEFEUP
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      height="8"
                      viewBox="0 0 200 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5.5C50 1.5 150 1.5 199 5.5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-red-600"
                      />
                    </svg>
                  </span>
                  <span className="text-foreground">?</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
                  Junta-te à maior comunidade de estudantes de informática da
                  FEUP. Conecta-te, aprende e cresce connosco numa jornada
                  incrível de descoberta tecnológica.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/signup" className="w-full">
                    <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-red-600 cursor-pointer w-full">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                          <Users className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
                        </div>
                        <CardTitle className="text-2xl text-left">
                          Registo
                        </CardTitle>
                        <CardDescription className="text-base text-left">
                          Após criares uma conta, podes preencher o formulário
                          de candidatura. Todas as estapas de marcação de
                          entrevista e marcação de dinâmica serão feitas nesta
                          plataforma.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-red-600 font-medium group-hover:gap-2 transition-all">
                          Proceder ao registo
                          <span className="inline-block transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
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
