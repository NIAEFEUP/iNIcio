"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Nova palavra-passe
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">
            Escolhe uma nova palavra-passe para a tua conta
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          {successMessage ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-full",
                })}
              >
                Voltar ao login
              </Link>
            </div>
          ) : errorMessage && (hasInvalidToken || !token) ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-full",
                })}
              >
                Voltar ao login
              </Link>
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
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 8 caracteres"
                            className="h-12 rounded-lg border-gray-200 pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            aria-label={
                              showPassword
                                ? "Esconder palavra-passe"
                                : "Mostrar palavra-passe"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
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
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repete a palavra-passe"
                            className="h-12 rounded-lg border-gray-200 pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            aria-label={
                              showConfirmPassword
                                ? "Esconder confirmação"
                                : "Mostrar confirmação"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading}
                  className="w-full"
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
