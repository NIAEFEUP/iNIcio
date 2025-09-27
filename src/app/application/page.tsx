"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileImageUpload } from "@/components/ui/profile-image-upload";
import { CVUpload } from "@/components/ui/cv-upload";
import {
  User,
  Phone,
  GraduationCap,
  Calendar,
  Camera,
  FileText,
  Linkedin,
  Github,
  Globe,
  Heart,
  MessageSquare,
  Lightbulb,
  Send,
} from "lucide-react";

export default function Candidatura() {
  const [formData, setFormData] = useState({
    phone: "",
    student_number: "",
    degree: "",
    curricular_year: "",
    profile_picture: "",
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
    fullname: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    profileImage: null as { fileName: string; url: string } | null,
    cv: null as { fileName: string; url: string } | null,
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required files
    if (!uploadedFiles.profileImage) {
      alert("Por favor, submete uma fotografia.");
      return;
    }

    // Include uploaded file URLs in form data
    const submissionData = {
      ...formData,
      profile_picture: uploadedFiles.profileImage?.url || "",
      curriculum: uploadedFiles.cv?.url || "",
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
        router.push("/candidate/progress");
      } else {
        const errorData = await res.json();
        alert(
          `Erro ao submeter candidatura: ${errorData.message || "Erro desconhecido"}`,
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Erro ao submeter candidatura. Tenta novamente.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    fieldName: "interests" | "recruitment_first_interaction",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(value)
        ? prev[fieldName].filter((item) => item !== value)
        : [...prev[fieldName], value],
    }));
  };

  const handleProfileImageSuccess = (result: {
    fileName: string;
    url: string;
  }) => {
    setUploadedFiles((prev) => ({
      ...prev,
      profileImage: result,
    }));
    setFormData((prev) => ({
      ...prev,
      profile_picture: result.url,
    }));
  };

  const handleCVSuccess = (result: { fileName: string; url: string }) => {
    setUploadedFiles((prev) => ({
      ...prev,
      cv: result,
    }));
    setFormData((prev) => ({
      ...prev,
      curriculum: result.url,
    }));
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    // You could show a toast notification here
  };

  return (
    <div className="min-h-screen form-gradient">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 py-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-balance mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Formulário de candidatura
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Junta-te à nossa comunidade de estudantes apaixonados por tecnologia
            e inovação. Preenche o formulário abaixo para começares a tua
            jornada connosco.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Informação Pessoal</CardTitle>
                  <CardDescription>
                    Os teus dados básicos para podermos entrar em contacto
                    contigo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="h-4 w-4 text-primary" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="fullname"
                  placeholder="Nome completo"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Número de Telemóvel *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+351 900 000 000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Número Mecanográfico *
                  </label>
                  <input
                    type="text"
                    name="student_number"
                    placeholder="202N0NNNN"
                    value={formData.student_number}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Curso *
                  </label>
                  <select
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    required
                  >
                    <option value="">Escolhe o teu curso</option>
                    <option value="leic">
                      L.EIC - Licenciatura em Engenharia Informática e
                      Computação
                    </option>
                    <option value="meic">
                      M.EIC - Mestrado em Engenharia Informática e Computação
                    </option>
                    <option value="mesw">
                      MESW - Mestrado em Engenharia de Software
                    </option>
                    <option value="mm">MM - Mestrado em Multimédia</option>
                    <option value="mia">
                      M.IA - Mestrado em Inteligência Artifical
                    </option>
                    <option value="liacd">
                      l:IACD - Licenciatura em Inteligência Artificial e Ciência
                      de Dados
                    </option>
                    <option value="mecd">
                      MECD - Mestrado em Engenharia e Ciência de Dados
                    </option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Ano Curricular *
                  </label>
                  <select
                    name="curricular_year"
                    value={formData.curricular_year}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                    required
                  >
                    <option value="">Ano curricular</option>
                    <option value="1bsc">1.º da Licenciatura</option>
                    <option value="2bsc">2.º da Licenciatura</option>
                    <option value="3bsc">3.º da Licenciatura</option>
                    <option value="1msc">1.º do Mestrado</option>
                    <option value="2msc">2.º do Mestrado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Documentos</CardTitle>
                  <CardDescription>
                    Submete os documentos necessários para a tua candidatura
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-3">
                    <Camera className="h-4 w-4 text-primary" />
                    Fotografia *
                  </label>
                  <ProfileImageUpload
                    onSuccess={handleProfileImageSuccess}
                    onError={handleUploadError}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Escolhe uma foto onde sejas facilmente identificável.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    CV
                  </label>
                  <CVUpload
                    onSuccess={handleCVSuccess}
                    onError={handleUploadError}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Submete o teu CV em formato PDF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Links Sociais</CardTitle>
                  <CardDescription>
                    Partilha os teus perfis online (opcional)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Linkedin className="h-4 w-4 text-primary" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  placeholder="linkedin.com/company/niaefeup"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Github className="h-4 w-4 text-primary" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="github"
                    placeholder="github.com/NIAEFEUP"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Site Pessoal
                  </label>
                  <input
                    type="url"
                    name="website"
                    placeholder="niaefeup.pt"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="h-11 w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Interesses</CardTitle>
                  <CardDescription>
                    Seleciona as áreas onde te vês a contribuir no NIAEFEUP
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-base font-medium mb-4 block">
                  O que te vês a fazer no NIAEFEUP? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { value: "projetos", label: "Projetos" },
                    { value: "imagem", label: "Imagem" },
                    { value: "comunicacao", label: "ComuNIcação" },
                    { value: "sinf", label: "Sinf" },
                    { value: "uni", label: "Uni" },
                    { value: "tts", label: "TTS" },
                    { value: "eventos", label: "Eventos" },
                    { value: "nitsig", label: "NitSig" },
                    { value: "website", label: "Website do NI" },
                    { value: "niployments", label: "NIployments" },
                  ].map((interest) => {
                    const isChecked = formData.interests.includes(
                      interest.value,
                    );
                    return (
                      <div
                        key={interest.value}
                        className={`checkbox-card rounded-xl border-2 p-4 flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() =>
                          handleCheckboxChange("interests", interest.value)
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            handleCheckboxChange("interests", interest.value)
                          }
                          className="w-4 h-4 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <label className="font-medium text-sm cursor-pointer flex-1">
                          {interest.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Questões</CardTitle>
                  <CardDescription>
                    Conta-nos mais sobre ti e a tua motivação *
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <label className="text-base font-medium mb-2 block">
                  Qual o teu interesse na opção/opções que escolheste? *
                </label>
                <textarea
                  name="interest_justification"
                  placeholder="Escreve aqui sobre o que te motiva nas áreas que selecionaste..."
                  value={formData.interest_justification}
                  onChange={handleInputChange}
                  className="min-h-[120px] w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-base font-medium mb-2 block">
                  Com que tecnologias/ferramentas já trabalhaste? (ex. React,
                  Photoshop, etc.) *
                </label>
                <textarea
                  name="experience"
                  placeholder="Lista as tecnologias, linguagens de programação, ferramentas de design, etc. que já utilizaste..."
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="min-h-[120px] w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-base font-medium mb-2 block">
                  Porquê o NI? *
                </label>
                <textarea
                  name="motivation"
                  placeholder="O que te atrai no NIAEFEUP? Que impacto esperas ter e receber?"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  className="min-h-[120px] w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-base font-medium mb-2 block">
                  O que achas que o NIAEFEUP pode ganhar ao receber-te como
                  membro? *
                </label>
                <textarea
                  name="self_promotion"
                  placeholder="Destaca as tuas competências, experiências e qualidades que podem contribuir para o NI..."
                  value={formData.self_promotion}
                  onChange={handleInputChange}
                  className="min-h-[120px] w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Como nos descobriste?
                  </CardTitle>
                  <CardDescription>
                    Ajuda-nos a perceber como chegaste até nós
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-base font-medium mb-4 block">
                  Como descobriste o recrutamento do NIAEFEUP?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: "instagram", label: "Instagram" },
                    { value: "amigos", label: "Amigos" },
                    { value: "professores", label: "Professores" },
                    { value: "email", label: "Email" },
                    { value: "aefeup", label: "AEFEUP" },
                    { value: "banca", label: "Banca no corredor da FEUP" },
                    { value: "open_day", label: "NI Open Day" },
                    { value: "outro", label: "Outro" },
                  ].map((source) => {
                    const isChecked =
                      formData.recruitment_first_interaction.includes(
                        source.value,
                      );
                    return (
                      <div
                        key={source.value}
                        className={`checkbox-card rounded-xl border-2 p-4 flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() =>
                          handleCheckboxChange(
                            "recruitment_first_interaction",
                            source.value,
                          )
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            handleCheckboxChange(
                              "recruitment_first_interaction",
                              source.value,
                            )
                          }
                          className="w-4 h-4 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <label className="font-medium text-sm cursor-pointer flex-1">
                          {source.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Sugestões</CardTitle>
                  <CardDescription>
                    Partilha as tuas ideias connosco (opcional)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-base font-medium mb-2 block">
                  Tens alguma sugestão para o NIAEFEUP ou algum dos seus
                  projetos?
                </label>
                <textarea
                  name="suggestions"
                  placeholder="Partilha as tuas ideias, sugestões de melhoria ou projetos que gostarias de ver implementados..."
                  value={formData.suggestions}
                  onChange={handleInputChange}
                  className="min-h-[120px] w-full bg-input/50 border border-border/50 rounded-md px-3 py-2 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Send className="h-4 w-4 mr-2" />
              Submeter Candidatura
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
