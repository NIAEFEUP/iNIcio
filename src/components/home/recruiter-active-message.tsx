import { Calendar, FileText, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RecruiterActiveMessage() {
  const router = useRouter();

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 h-full w-full">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
            Fazes parte da equipa de{" "}
            <span className="text-primary">Recrutamento</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
            Podes ver os candidatos e comentar nas suas candidaturas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => router.push("/recruiter/candidates")}
              variant="secondary"
              size="default"
            >
              <FileText className="mr-2 h-5 w-5" />
              Ver Candidatos
            </Button>
            <Button
              onClick={() => router.push("/recruiter/candidates")}
              variant="secondary"
              size="default"
            >
              <Calendar className="ml-2 h-5 w-5" />
              Marcar disponibilidades
            </Button>
            <Button
              onClick={() => router.push("/profile")}
              variant="default"
              size="default"
            >
              <User className="mr-2 h-5 w-5" />
              Ver Perfil
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl"></div>
    </section>
  );
}
