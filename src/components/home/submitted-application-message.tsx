import { ArrowRight, FileText, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SubmittedApplicationMessage() {
  const router = useRouter();

  return (
    <section className="bg-gradient-to-br from-background via-muted/30 to-primary/5 h-full w-full">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance mb-6">
            Completa o teu <span className="text-primary">processo</span> de
            <br />
            <span className="text-foreground">recrutamento</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto leading-relaxed">
            Estás quase lá! Se ainda não o fizeste, completa os passos em falta
            para terminares a tua candidatura ao{" "}
            <span className="text-primary font-semibold">NIAEFEUP</span> e
            juntares-te à nossa comunidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => router.push("/candidate/progress")}
              size="default"
              variant="secondary"
            >
              <FileText className="mr-2 h-5 w-5" />
              Ver progresso
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
