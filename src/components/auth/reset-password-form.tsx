"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "A palavra-passe deve ter no mínimo 8 caracteres" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormProps = {
  token?: string;
  hasInvalidToken: boolean;
};

export default function ResetPasswordForm({
  token,
  hasInvalidToken,
}: ResetPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasInvalidToken || !token
      ? "A ligação de recuperação é inválida ou expirou."
      : null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      form.reset();
      setSuccessMessage(
        "A tua palavra-passe foi alterada. Já podes entrar com a nova palavra-passe.",
      );
    } catch {
      setErrorMessage("Não foi possível alterar a palavra-passe");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10 sm:py-12">
      <div className="grid w-full max-w-4xl items-center gap-12 sm:gap-16 md:grid-cols-2 lg:gap-24">
        <div className="space-y-3 text-center md:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Nova palavra-passe
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            Escolhe uma nova palavra-passe para a tua conta.
          </p>
        </div>

        <div className="space-y-6">
          {successMessage ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="size-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
              <Button className="w-full" render={<Link href="/login" />}>
                Voltar ao login
              </Button>
            </div>
          ) : errorMessage && (hasInvalidToken || !token) ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <Button className="w-full" render={<Link href="/login" />}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova palavra-passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            className="h-11 pl-9 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={
                              showPassword
                                ? "Esconder palavra-passe"
                                : "Mostrar palavra-passe"
                            }
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar palavra-passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repete a palavra-passe"
                            className="h-11 pl-9 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={
                              showConfirmPassword
                                ? "Esconder confirmação"
                                : "Mostrar confirmação"
                            }
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? "A guardar..." : "Alterar palavra-passe"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
