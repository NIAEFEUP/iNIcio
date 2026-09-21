"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  GraduationCap,
  FileText,
  Globe,
  Heart,
  MessageSquare,
  Lightbulb,
  Send,
  Info,
  AlertCircle,
} from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CVUpload } from "@/components/ui/cv-upload";

const INTEREST_OPTIONS = [
  { value: "projetos", label: "Projetos" },
  { value: "imagem", label: "Imagem" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "sinf", label: "Sinf (Semana de Informática)" },
  { value: "uni", label: "Uni" },
  { value: "tts", label: "TTS" },
  { value: "eventos", label: "Eventos" },
  { value: "nitsig", label: "NitSig" },
  { value: "website", label: "Website do NI" },
  { value: "niployments", label: "NIployments" },
];

const DISCOVERY_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "amigos", label: "Amigos / Colegas" },
  { value: "professores", label: "Professores" },
  { value: "email", label: "Email institucional" },
  { value: "aefeup", label: "AEFEUP" },
  { value: "banca", label: "Banca no corredor da FEUP" },
  { value: "open_day", label: "NI Open Day" },
  { value: "outro", label: "Outro" },
];

export default function ApplicationClient() {
  const router = useRouter();

  const [formData, setFormData] = useState(() => {
    let savedApp = null;
    if (typeof window !== "undefined") {
      savedApp = localStorage.getItem("application");
    }

    return savedApp
      ? JSON.parse(savedApp)
      : {
          phone: "",
          student_number: "",
          degree: "",
          curricular_year: "",
          curriculum: "",
          linkedin: "",
          github: "",
          website: "",
          interests: [] as string[],
          interest_justification: "",
          experience: "",
          motivation: "",
          self_promotion: "",
          recruitment_first_interaction: [] as string[],
          suggestions: "",
        };
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    cv: null as { fileName: string; url: string } | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("application", JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const submissionData = {
      ...formData,
      curriculum: uploadedFiles.cv?.url || formData.curriculum || "",
    };

    try {
      const res = await fetch("/api/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        localStorage.removeItem("application");
        router.push("/candidate/progress");
        router.refresh();
      } else {
        const errorData = await res.json();
        setErrorMessage(
          errorData.message ||
            errorData.error ||
            "Ocorreu um erro ao submeter a candidatura.",
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage("Erro de ligação. Por favor, tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    fieldName: "interests" | "recruitment_first_interaction",
    value: string,
  ) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(value)
        ? prev[fieldName].filter((item: string) => item !== value)
        : [...prev[fieldName], value],
    }));
  };

  const handleCVSuccess = (result: { fileName: string; url: string }) => {
    setUploadedFiles((prev) => ({ ...prev, cv: result }));
    setFormData((prev: typeof formData) => ({
      ...prev,
      curriculum: result.fileName,
    }));
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    setErrorMessage("Erro no carregamento do CV: " + error);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start">
        <div className="space-y-3 md:sticky md:top-28 md:self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Formulário de Candidatura
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Preenche com calma as informações abaixo para te podermos conhecer
            melhor. O progresso é guardado automaticamente no teu navegador.
          </p>

          <Card className="bg-muted/40">
            <CardContent>
              <Accordion>
                <AccordionItem value="tips" className="border-b-0">
                  <AccordionTrigger className="py-1 text-sm font-medium hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Info className="size-4 text-primary" />
                      Informações importantes e sobre os departamentos
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 pb-0 text-xs md:text-sm text-muted-foreground space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Contactos & Avaliação:
                      </p>
                      <p>
                        • Mantém atenção ao teu email nos próximos dias para
                        acompanhares convocações.
                      </p>
                      <p>
                        • O número de telemóvel será usado apenas para contactos
                        urgentes de agendamento.
                      </p>
                      <p>
                        • A submissão de CV e links (GitHub, LinkedIn,
                        portfólio) é opcional, mas valorizada!
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 md:gap-2.5 pt-2">
                      <div className="rounded-lg border border-border p-2.5 bg-background md:flex md:items-start md:gap-2.5">
                        <p className="font-medium text-foreground text-xs">
                          Projetos
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 md:mt-0">
                          Desenvolvimento de soluções para a comunidade
                          académica (uni, TTS, NIployments).
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-2.5 bg-background md:flex md:items-start md:gap-2.5">
                        <p className="font-medium text-foreground text-xs">
                          Eventos
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 md:mt-0">
                          Semana de Informática (SINF), workshops e convívios
                          académicos.
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-2.5 bg-background md:flex md:items-start md:gap-2.5">
                        <p className="font-medium text-foreground text-xs">
                          Imagem & Comunicação
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 md:mt-0">
                          Criação gráfica, UI/UX, redes sociais, merchandising e
                          divulgação do núcleo.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">Informação Pessoal</CardTitle>
                  <CardDescription>
                    Dados para identificação e contacto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telemóvel *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+351 912 345 678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_number">Número Mecanográfico *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="student_number"
                      name="student_number"
                      type="text"
                      placeholder="ex: 202301234"
                      value={formData.student_number}
                      onChange={handleInputChange}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Curso *</Label>
                  <NativeSelect
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  >
                    <NativeSelectOption value="">
                      Seleciona o teu curso
                    </NativeSelectOption>
                    <NativeSelectOption value="leic">
                      L.EIC - Engenharia Informática e Computação
                    </NativeSelectOption>
                    <NativeSelectOption value="meic">
                      M.EIC - Engenharia Informática e Computação
                    </NativeSelectOption>
                    <NativeSelectOption value="mesw">
                      MESW - Engenharia de Software
                    </NativeSelectOption>
                    <NativeSelectOption value="liacd">
                      L.IACD - IA e Ciência de Dados
                    </NativeSelectOption>
                    <NativeSelectOption value="mecd">
                      MECD - Ciência de Dados
                    </NativeSelectOption>
                    <NativeSelectOption value="mm">
                      MM - Multimédia
                    </NativeSelectOption>
                    <NativeSelectOption value="mia">
                      M.IA - Inteligência Artificial
                    </NativeSelectOption>
                    <NativeSelectOption value="outro">
                      Outro curso FEUP / U.Porto
                    </NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curricular_year">Ano Curricular *</Label>
                  <NativeSelect
                    id="curricular_year"
                    name="curricular_year"
                    value={formData.curricular_year}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                  >
                    <NativeSelectOption value="">
                      Seleciona o ano atual
                    </NativeSelectOption>
                    <NativeSelectOption value="1bsc">
                      1.º ano de Licenciatura
                    </NativeSelectOption>
                    <NativeSelectOption value="2bsc">
                      2.º ano de Licenciatura
                    </NativeSelectOption>
                    <NativeSelectOption value="3bsc">
                      3.º ano de Licenciatura
                    </NativeSelectOption>
                    <NativeSelectOption value="1msc">
                      1.º ano de Mestrado
                    </NativeSelectOption>
                    <NativeSelectOption value="2msc">
                      2.º ano de Mestrado
                    </NativeSelectOption>
                    <NativeSelectOption value="outro">Outro</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">Curriculum Vitae</CardTitle>
                  <CardDescription>
                    Submete o teu currículo em formato PDF (recomendado)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CVUpload
                onSuccess={handleCVSuccess}
                onError={handleUploadError}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">
                    Links & Presença Online
                  </CardTitle>
                  <CardDescription>
                    Partilha perfis que ajudem a conhecer o teu percurso
                    (opcional)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <FaLinkedin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    type="url"
                    name="linkedin"
                    placeholder="https://linkedin.com/in/oteunome"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <div className="relative">
                    <FaGithub className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="github"
                      type="url"
                      name="github"
                      placeholder="https://github.com/oteuuser"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site Pessoal / Portfólio</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      name="website"
                      placeholder="https://omeusite.pt"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">
                    Áreas de Interesse *
                  </CardTitle>
                  <CardDescription>
                    Seleciona as equipas ou projetos onde gostarias de colaborar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INTEREST_OPTIONS.map((item) => {
                  const checked = formData.interests.includes(item.value);
                  return (
                    <label
                      key={item.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          handleCheckboxChange("interests", item.value)
                        }
                      />
                      <span className="text-xs sm:text-sm select-none">
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="interest_justification">
                  Porque escolheste estas áreas? *
                </Label>
                <Textarea
                  id="interest_justification"
                  name="interest_justification"
                  placeholder="Explica brevemente o que te atrai nestas opções e o que esperas aprender ou contribuir..."
                  value={formData.interest_justification}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">
                    Percurso & Motivação
                  </CardTitle>
                  <CardDescription>
                    Não precisas de ter vasta experiência. Valorizamos a vontade
                    de aprender!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">
                  Que tecnologias ou ferramentas já experimentaste?
                </Label>
                <Textarea
                  id="experience"
                  name="experience"
                  placeholder="Ex: C, Python, JavaScript, Figma, Git, ou projetos de cadeiras... Se estiveres a começar, não hesites em dizer!"
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Porquê o NI? *</Label>
                <Textarea
                  id="motivation"
                  name="motivation"
                  placeholder="O que te motivou a concorrer ao núcleo e o que esperas retirar desta experiência?"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="self_promotion">
                  O que podes trazer à equipa? *
                </Label>
                <Textarea
                  id="self_promotion"
                  name="self_promotion"
                  placeholder="Fala-nos de qualidades tuas, como curiosidade, trabalho em equipa, dedicação, etc."
                  value={formData.self_promotion}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div>
                  <CardTitle className="text-lg">
                    Como nos descobriste?
                  </CardTitle>
                  <CardDescription>
                    Ajuda-nos a perceber de onde chegaste e deixa qualquer ideia
                    que tenhas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Onde ouviste falar deste recrutamento?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {DISCOVERY_OPTIONS.map((item) => {
                    const checked =
                      formData.recruitment_first_interaction.includes(
                        item.value,
                      );
                    return (
                      <label
                        key={item.value}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            handleCheckboxChange(
                              "recruitment_first_interaction",
                              item.value,
                            )
                          }
                        />
                        <span className="text-xs select-none">
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="suggestions">
                  Tens alguma ideia ou sugestão para o núcleo? (opcional)
                </Label>
                <Textarea
                  id="suggestions"
                  name="suggestions"
                  placeholder="Alguma ideia de projeto, evento ou melhoria que gostarias de ver no NI?"
                  value={formData.suggestions}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Ao submeteres, a tua candidatura fica disponível para a equipa do
              NI avaliar.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto gap-2"
            >
              <Send className="size-4" />
              {isSubmitting ? "A submeter..." : "Submeter Candidatura"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
