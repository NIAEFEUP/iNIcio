import { Calendar } from "lucide-react";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

export default function RecruiterActiveMessage() {
  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 h-full w-full">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
            Fazes parte da equipa de{" "}
            <span className="text-red-600 relative inline-block">
              Recrutamento
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
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
            Podes ver os candidatos e comentar nas suas candidaturas.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <Link href="/candidates" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-red-600 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                    <Users className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-2xl text-left">
                    Ver Candidatos
                  </CardTitle>
                  <CardDescription className="text-base text-left">
                    Acede à lista completa de candidatos e revê as suas
                    candidaturas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-red-600 font-medium group-hover:gap-2 transition-all">
                    Explorar candidatos
                    <span className="inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/recruiter/availability" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-red-600 cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                    <Calendar className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-2xl text-left">
                    Marcar disponibilidades
                  </CardTitle>
                  <CardDescription className="text-base text-left">
                    Define os teus horários disponíveis para entrevistas e
                    reuniões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-red-600 font-medium group-hover:gap-2 transition-all">
                    Gerir calendário
                    <span className="inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"></div>
        </div>
      </div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
    </section>
  );
}
