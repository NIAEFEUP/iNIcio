import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { RecruitmentPhase } from "@/lib/db";
import type {
  RecruitmentStatus,
  ApplicationStatus,
} from "@/lib/recruitment-state";

interface LandingPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: "candidate" | "recruiter" | "admin" | null;
  } | null;
  isCandidate?: boolean;
  isRecruiter: boolean;
  isAdmin: boolean;
  hasApplied: boolean;
  recruitmentStatus: RecruitmentStatus;
  applicationStatus: ApplicationStatus;
  applicationDeadline?: string | null;
  phases?: RecruitmentPhase[];
}

export default function LandingPage({
  user,
  isRecruiter,
  isAdmin,
  hasApplied,
  recruitmentStatus,
  applicationStatus,
  applicationDeadline,
}: LandingPageProps) {
  const isApplicationOpen =
    recruitmentStatus === "open" && applicationStatus === "open";

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary mb-4">
          Recrutamento NIAEFEUP{" "}
          {isApplicationOpen && applicationDeadline
            ? `· Até ${applicationDeadline}`
            : ""}
        </p>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
          Constrói tecnologia com impacto real.
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          Somos o Núcleo de Informática da FEUP. Desenvolvemos o Uni e
          ferramentas usadas diariamente por milhares de estudantes, organizamos
          a SINF e aprendemos juntos todos os dias.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!user ? (
            <>
              <Link
                href={isApplicationOpen ? "/signup" : "/login"}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base px-6 h-12 gap-2",
                )}
              >
                {isApplicationOpen ? "Candidatar Agora" : "Entrar no iNIcio"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-base px-6 h-12",
                )}
              >
                Já tens conta? Entrar
              </Link>
            </>
          ) : hasApplied ? (
            <>
              <Link
                href="/candidate/progress"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base px-6 h-12 gap-2",
                )}
              >
                Acompanhar o meu Progresso
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/application"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-base px-6 h-12",
                )}
              >
                Ver a Minha Candidatura
              </Link>
            </>
          ) : isRecruiter || isAdmin ? (
            <Link
              href={isAdmin ? "/admin" : "/candidates"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-6 h-12 gap-2",
              )}
            >
              Painel de Recrutamento
              <ArrowRight className="size-4" />
            </Link>
          ) : isApplicationOpen ? (
            <Link
              href="/application"
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-6 h-12 gap-2",
              )}
            >
              Preencher Candidatura
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">
              As candidaturas estão encerradas de momento. Fica atento às
              próximas novidades!
            </span>
          )}
        </div>
      </section>

      {/* Photography Showcase: Life at NIAEFEUP */}
      <section className="py-8 sm:py-12 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Photo 1: SINF */}
          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-[4/3] sm:aspect-[3/4]">
            <Image
              src="/images/sinf-auditorium.jpg"
              alt="Auditório da SINF na FEUP"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Eventos & Conferências
              </span>
              <p className="text-base font-bold leading-tight mt-0.5">
                Organização da SINF
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                A maior conferência de tecnologia organizada por estudantes no
                país.
              </p>
            </div>
          </div>

          {/* Photo 2: Development & Hackathons */}
          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-[4/3] sm:aspect-[3/4]">
            <Image
              src="/images/hackathon.jpg"
              alt="Equipa a desenvolver software"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Desenvolvimento
              </span>
              <p className="text-base font-bold leading-tight mt-0.5">
                Projetos com Impacto
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Código real em produção: app Uni, TTS, e ferramentas para a
                UPorto.
              </p>
            </div>
          </div>

          {/* Photo 3: Workshops & Mentorship */}
          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-[4/3] sm:aspect-[3/4]">
            <Image
              src="/images/workshop.jpg"
              alt="Workshop e partilha de conhecimento"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Aprendizagem
              </span>
              <p className="text-base font-bold leading-tight mt-0.5">
                Workshops & Mentoria
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Aprende tecnologias modernas com o apoio de quem já cá está.
              </p>
            </div>
          </div>

          {/* Photo 4: Team & Community */}
          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-[4/3] sm:aspect-[3/4]">
            <Image
              src="/images/team-social.jpg"
              alt="Membros do NIAEFEUP juntos"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Comunidade
              </span>
              <p className="text-base font-bold leading-tight mt-0.5">
                Família NIAEFEUP
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Sala B315 de portas abertas, convívios, jantares e amizades para
                a vida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Section - Honest & Direct */}
      <section className="py-16 sm:py-20 max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Não precisas de ser um génio da programação.
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Esta é a maior hesitação de quem pensa em candidatar-se: achar que não
          sabe o suficiente. No NIAEFEUP valorizamos a tua vontade de aprender,
          curiosidade e dedicação. A vasta maioria dos membros entrou no
          primeiro ano sem saber nada de desenvolvimento Web ou Mobile, e hoje
          constroem software de topo mundial.
        </p>
      </section>

      {/* Process Section - Straightforward */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Como funciona
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
            O processo em 4 passos simples
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">01</span>
            <h4 className="font-bold text-foreground text-base">Candidatura</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Preenches um formulário rápido com os teus interesses,
              disponibilidade e percurso.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">02</span>
            <h4 className="font-bold text-foreground text-base">
              Dinâmica de Grupo
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Uma sessão prática e descontraída em equipa para resolvermos
              desafios em conjunto.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">03</span>
            <h4 className="font-bold text-foreground text-base">Entrevista</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Uma conversa individual para te conhecermos melhor, alinhar
              expectativas e objetivos.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">04</span>
            <h4 className="font-bold text-foreground text-base">Integração</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Comunicação dos resultados e boas-vindas com início imediato nas
              equipas do núcleo.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 max-w-2xl mx-auto px-4 sm:px-6 w-full">
        <h3 className="text-2xl font-bold text-foreground text-center mb-8">
          Perguntas Frequentes
        </h3>

        <Accordion className="space-y-2">
          <AccordionItem value="faq-1" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Alunos do 1.º ano podem candidatar-se?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sim! Grande parte da nossa equipa entrou precisamente no primeiro
              ano da faculdade. É a melhor maneira de aprender a programar a
              sério e fazer amigos para o resto do curso.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Quanto tempo por semana é necessário dedicar?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              A faculdade e os teus estudos estão sempre em primeiro lugar. A
              dedicação habitual é de 3 a 5 horas por semana, com total
              flexibilidade durante épocas de exames e entregas de trabalhos.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Estudantes de outros cursos além de Informática podem entrar?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sim, absolutamente. Se tens gosto por programação, design,
              comunicação, fotografia ou organização de eventos, és mais do que
              bem-vindo/a.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Bottom Direct CTA */}
      <section className="py-16 text-center max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Queres construir coisas fixes connosco?
        </h2>
        <div>
          {!user ? (
            <Link
              href={isApplicationOpen ? "/signup" : "/login"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-8 h-12 gap-2",
              )}
            >
              {isApplicationOpen
                ? "Começar a Candidatura"
                : "Entrar na Plataforma"}
              <ArrowRight className="size-4" />
            </Link>
          ) : hasApplied ? (
            <Link
              href="/candidate/progress"
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-8 h-12 gap-2",
              )}
            >
              Acompanhar o meu Progresso
              <ArrowRight className="size-4" />
            </Link>
          ) : isApplicationOpen ? (
            <Link
              href="/application"
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-8 h-12 gap-2",
              )}
            >
              Preencher Candidatura
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
