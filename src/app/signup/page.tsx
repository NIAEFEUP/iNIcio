"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

const formSchema = z
  .object({
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    surname: z.string().min(1, { message: "O apelido é obrigatório" }),
    email: z
      .email({ message: "O email é inválido" })
      .min(1, { message: "O email é obrigatório" }),
    password: z
      .string()
      .min(8, { message: "A palavra-passe deve ter no mínimo 8 caracteres" }),
    "confirm-password": z.string(),
  })
  .refine((data) => data.password === data["confirm-password"], {
    message: "As palavras-passe não coincidem",
    path: ["confirm-password"],
  });

type FormData = z.infer<typeof formSchema>;

export default function SignUp() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [signupData, setSignupData] = useState<FormData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      "confirm-password": "",
    },
  });

  async function onSubmit(values: FormData) {
    setSignupData(values);
    setErrorMessage(null);
    setStep(2);
  }

  const handleCompleteSignup = async () => {
    if (!signupData || !selectedImage) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data: session } = await authClient.getSession({ query: {} });

      if (!session) {
        const { error: signUpError } = await authClient.signUp.email({
          email: signupData.email,
          password: signupData.password,
          name: `${signupData.name} ${signupData.surname}`,
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
          setIsLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("type", "profile");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar a fotografia de perfil");
      }

      const uploadData = await res.json();

      await authClient.updateUser({
        image: uploadData.fileName,
      });

      router.push("/application");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro durante a criação de conta";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    form.clearErrors();
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:py-12">
      <div className="grid w-full max-w-4xl items-center gap-12 sm:gap-16 md:grid-cols-2 lg:gap-24">
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {step === 1 ? "Criar Conta" : "Fotografia de Perfil"}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            {step === 1
              ? "Preenche os teus dados para iniciar a tua candidatura"
              : "Adiciona uma fotografia de rosto clara para concluir o teu perfil de candidato"}
          </p>
        </div>

        <div className="space-y-6">
          <div
            className="flex w-full max-w-[12rem] items-center gap-2"
            aria-hidden
          >
            <span
              className={cn(
                "h-1.5 flex-1 rounded-full",
                step >= 1 ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "h-1.5 flex-1 rounded-full",
                step >= 2 ? "bg-primary" : "bg-muted",
              )}
            />
          </div>

          {step === 1 ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                onReset={handleReset}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              placeholder="Nome"
                              type="text"
                              className="h-11 pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apelido</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              placeholder="Apelido"
                              type="text"
                              className="h-11 pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="utilizador@exemplo.com"
                            type="email"
                            className="h-11 pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Palavra-Passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Mínimo 8 caracteres"
                            type={showPassword ? "text" : "password"}
                            className="h-11 pl-9 pr-9"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm-password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Palavra-Passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Confirma a tua palavra-passe"
                            type={showConfirmPassword ? "text" : "password"}
                            className="h-11 pl-9 pr-9"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-5">
              <FileUpload
                type="image"
                onFileSelect={(file) => setSelectedImage(file)}
                onFileRemove={() => setSelectedImage(null)}
                currentFileName={selectedImage?.name}
                required
              />

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleCompleteSignup}
                  disabled={!selectedImage || isLoading}
                  className="w-full"
                >
                  {isLoading ? "A concluir..." : "Concluir Registo"}
                </Button>
                <Button
                  onClick={() => setStep(1)}
                  variant="ghost"
                  disabled={isLoading}
                  className="w-full"
                >
                  Voltar aos dados
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-muted-foreground">
              Já tens conta?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Entrar
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
