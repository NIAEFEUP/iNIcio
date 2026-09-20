import Link from "next/link";
import {
  Code2,
  Users2,
  Calendar,
  ArrowRight,
  Compass,
  Laptop,
  HelpCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Logged in state announcement banner */}
      {user && (
        <div className="border-b border-border bg-muted/40 py-3 px-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>
                Sessão iniciada como <strong>{user.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasApplied ? (
                <>
                  <Link
                    href="/candidate/progress"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 text-xs",
                    )}
                  >
                    Ver Progresso
                  </Link>
                  <Link
                    href="/application"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "h-8 text-xs",
                    )}
                  >
                    A Minha Candidatura
                  </Link>
                </>
              ) : isRecruiter || isAdmin ? (
                <Link
                  href={isAdmin ? "/admin" : "/candidates"}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 text-xs",
                  )}
                >
                  Painel de Recrutamento
                </Link>
              ) : isApplicationOpen ? (
                <Link
                  href="/application"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "h-8 text-xs",
                  )}
                >
                  Preencher Candidatura
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-8">
          {/* Subtle status indicator - NO badge spam */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-xs">
            <span
              className={cn(
                "size-2 rounded-full",
                isApplicationOpen
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500",
              )}
            />
            {isApplicationOpen ? (
              <span>
                Candidaturas Abertas
                {applicationDeadline ? ` até ${applicationDeadline}` : ""}
              </span>
            ) : recruitmentStatus === "upcoming" ? (
              <span>Novo ciclo de recrutamento a preparar brevemente</span>
            ) : (
              <span>Candidaturas encerradas de momento</span>
            )}
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Constrói tecnologia com impacto real no{" "}
              <span className="text-primary">NIAEFEUP</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
              Somos o Núcleo de Informática da FEUP. Desenvolvemos ferramentas
              usadas diariamente por milhares de estudantes, organizamos os
              maiores eventos tecnológicos do Porto e aprendemos juntos todos os
              dias.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {!user ? (
              <>
                <Link
                  href={isApplicationOpen ? "/signup" : "/login"}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full sm:w-auto text-base gap-2",
                  )}
                >
                  {isApplicationOpen ? "Candidatar Agora" : "Entrar no iNIcio"}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto text-base",
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
                    "w-full sm:w-auto text-base gap-2",
                  )}
                >
                  Acompanhar o meu Progresso
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/application"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto text-base",
                  )}
                >
                  Ver Dados da Candidatura
                </Link>
              </>
            ) : isApplicationOpen ? (
              <Link
                href="/application"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto text-base gap-2",
                )}
              >
                Preencher a Candidatura
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link
                href="/candidate/progress"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto text-base",
                )}
              >
                Ver Estado do Recrutamento
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Why Apply Section */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Porque deves candidatar-te?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              O que faz o NIAEFEUP ser único
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Participar no núcleo vai muito além de adicionar uma linha ao teu
              currículo. É uma experiência transformadora na tua passagem pela
              faculdade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <Card className="border-border bg-card hover:border-border/80 transition-colors">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Laptop className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold text-foreground">
                    Projetos Reais em Produção
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Não desenvolvemos trabalhos teóricos que ficam esquecidos
                    numa pasta. Criamos produtos como o <strong>Uni</strong>, a
                    plataforma da <strong>SINF</strong> e ferramentas que
                    facilitam o dia a dia de milhares de estudantes da
                    Universidade do Porto.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-border bg-card hover:border-border/80 transition-colors">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Code2 className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold text-foreground">
                    Aprendizagem Prática e Mentoria
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Trabalha com tecnologias atuais do mercado (TypeScript,
                    Next.js, Go, Docker, arquiteturas cloud e design UI/UX) em
                    conjunto com colegas de anos mais avançados prontos para te
                    apoiar e acelerar a tua evolução.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-border bg-card hover:border-border/80 transition-colors">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold text-foreground">
                    Organização da SINF
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Faz parte da equipa responsável pela Semana de Informática —
                    a maior conferência tecnológica organizada por estudantes do
                    país. Desenvolve competências de liderança, logística e
                    contacto direto com empresas de topo mundial.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="border-border bg-card hover:border-border/80 transition-colors">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Users2 className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-semibold text-foreground">
                    Comunidade e Amigos para a Vida
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mais do que trabalho técnico, o NIAEFEUP é uma família.
                    Jantares regulares, convívios, workshops e uma forte rede de
                    antigos membros que estão hoje a trabalhar nas principais
                    empresas de tecnologia internacionais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Myth Buster Section */}
      <section className="py-16 sm:py-20 bg-muted/20 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Compass className="size-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            &ldquo;Não sei se tenho conhecimentos suficientes para entrar&rdquo;
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Esta é a dúvida mais comum entre novos estudantes. No NIAEFEUP{" "}
            <strong>não procuramos peritos nem anos de experiência</strong>.
            Valorizamos sobretudo a tua curiosidade, dedicação e vontade de
            aprender. Todos os membros do núcleo começaram exatamente no mesmo
            ponto.
          </p>
        </div>
      </section>

      {/* Recruitment Process Steps */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center space-y-3 mb-12 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Processo de Seleção
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Como funciona o recrutamento?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Um processo transparente e pensado para te sentires confortável em
              cada momento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
              <span className="text-2xl font-black text-muted-foreground/50">
                01
              </span>
              <h3 className="font-semibold text-foreground text-base">
                Candidatura Online
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Preenches um formulário com os teus interesses, motivações e
                percurso. Demora apenas cerca de 10 minutos.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
              <span className="text-2xl font-black text-muted-foreground/50">
                02
              </span>
              <h3 className="font-semibold text-foreground text-base">
                Dinâmica de Grupo
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Uma atividade colaborativa e descontraída em equipa para nos
                conhecermos melhor e trabalharmos juntos.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
              <span className="text-2xl font-black text-muted-foreground/50">
                03
              </span>
              <h3 className="font-semibold text-foreground text-base">
                Entrevista Pessoal
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Uma conversa individual para falar sobre as tuas expectativas,
                áreas em que gostarias de atuar e disponibilidade.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl border border-border bg-card">
              <span className="text-2xl font-black text-muted-foreground/50">
                04
              </span>
              <h3 className="font-semibold text-foreground text-base">
                Integração
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Comunicação dos resultados finais e boas-vindas oficiais com
                início imediato nos projetos e convívios!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-border/60 bg-muted/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center space-y-3 mb-10">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <HelpCircle className="size-3.5" />
              Perguntas Frequentes
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Dúvidas comuns sobre o recrutamento
            </h2>
          </div>

          <Accordion className="space-y-3">
            <AccordionItem
              value="faq-1"
              className="rounded-lg border border-border bg-card px-4"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Alunos do primeiro ano podem candidatar-se?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Sim, absolutamente! Uma grande percentagem dos nossos membros
                entrou precisamente no primeiro ano de faculdade. O núcleo é uma
                das melhores formas de te ambientares à FEUP e fazeres amigos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-2"
              className="rounded-lg border border-border bg-card px-4"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Quanto tempo por semana é esperado dedicar ao núcleo?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                O percurso académico está sempre em primeiro lugar. Em média, a
                dedicação ronda as 3 a 5 horas semanais, com horários flexíveis
                e adaptação completa a períodos de testes e exames.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-3"
              className="rounded-lg border border-border bg-card px-4"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Estudantes de outros cursos além de LEIC/MEIC podem entrar?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Sim! Qualquer estudante da Universidade do Porto com interesse
                em desenvolvimento de software, design de interfaces,
                comunicação ou gestão de eventos é bem-vindo a concorrer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-4"
              className="rounded-lg border border-border bg-card px-4"
            >
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                O que acontece se eu não puder comparecer a um horário agendado?
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Tanto a dinâmica de grupo como a entrevista oferecem múltiplos
                slots que podes escolher no portal. Se surgir algum imprevisto,
                basta contactar-nos com antecedência para reagendarmos.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Preparado para dar o próximo passo?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Aproveita a oportunidade para fazer a diferença na comunidade
              estudantil e acelerar a tua carreira tecnológica.
            </p>
          </div>

          <div className="pt-2">
            {!user ? (
              <Link
                href={isApplicationOpen ? "/signup" : "/login"}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base gap-2",
                )}
              >
                {isApplicationOpen
                  ? "Iniciar Candidatura"
                  : "Entrar na Plataforma"}
                <ArrowRight className="size-4" />
              </Link>
            ) : hasApplied ? (
              <Link
                href="/candidate/progress"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base gap-2",
                )}
              >
                Acompanhar Progresso
                <ArrowRight className="size-4" />
              </Link>
            ) : isApplicationOpen ? (
              <Link
                href="/application"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base gap-2",
                )}
              >
                Preencher Candidatura
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
